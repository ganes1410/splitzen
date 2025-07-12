import { query } from "./_generated/server";
import { v } from "convex/values";

export const getBalances = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }
    const currency = group.currency;

    if (!currency) {
      return [];
    }

    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    const members = await ctx.db
      .query("members")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    const users = (
      await Promise.all(members.map((member) => ctx.db.get(member.userId)))
    ).filter(Boolean);

    const balances: { [userId: string]: number } = {};
    users.forEach((user) => {
      if (user) {
        balances[user._id] = 0;
      }
    });

    expenses.forEach((expense) => {
      balances[expense.payerId] += expense.amount;
      const splitAmount = expense.amount / expense.splitAmong.length;
      expense.splitAmong.forEach((userId) => {
        balances[userId] -= splitAmount;
      });
    });

    settlements.forEach((settlement) => {
      balances[settlement.from] += settlement.amount;
      balances[settlement.to] -= settlement.amount;
    });

    const allTransactions: {
      from: string;
      to: string;
      amount: number;
      currency: string;
    }[] = [];

    const positiveBalances: { userId: string; amount: number }[] = [];
    const negativeBalances: { userId: string; amount: number }[] = [];

    const EPSILON = 0.0001; // A small value to account for floating-point inaccuracies

    for (const userId in balances) {
      if (balances[userId] > EPSILON) {
        // Check if significantly positive
        positiveBalances.push({ userId, amount: balances[userId] });
      } else if (balances[userId] < -EPSILON) {
        // Check if significantly negative
        negativeBalances.push({ userId, amount: -balances[userId] });
      }
      // If balance is between -EPSILON and EPSILON, treat as zero and ignore
    }

    let i = 0;
    let j = 0;

    while (i < positiveBalances.length && j < negativeBalances.length) {
      const giver = positiveBalances[i];
      const receiver = negativeBalances[j];

      const amount = Math.min(giver.amount, receiver.amount);

      allTransactions.push({
        from: receiver.userId,
        to: giver.userId,
        amount: parseFloat(amount.toFixed(2)), // Round for display
        currency,
      });

      giver.amount -= amount;
      receiver.amount -= amount;

      // Advance pointers if balances are effectively zero
      if (giver.amount <= EPSILON) {
        i++;
      }

      if (receiver.amount <= EPSILON) {
        j++;
      }
    }

    return allTransactions;
  },
});

export const getUserBalanceInGroup = query({
  args: { userId: v.id("users"), groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    let balance = 0;

    expenses.forEach((expense) => {
      if (expense.payerId === args.userId) {
        balance += expense.amount;
      }
      if (expense.splitAmong.includes(args.userId)) {
        balance -= expense.amount / expense.splitAmong.length;
      }
    });

    settlements.forEach((settlement) => {
      if (settlement.from === args.userId) {
        balance += settlement.amount;
      }
      if (settlement.to === args.userId) {
        balance -= settlement.amount;
      }
    });

    return balance;
  },
});
