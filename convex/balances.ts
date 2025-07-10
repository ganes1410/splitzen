
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

    const users = (await Promise.all(
      members.map((member) => ctx.db.get(member.userId))
    )).filter(Boolean);

    const balances: { [userId: string]: number } = {};
    users.forEach(user => {
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

    const allTransactions: { from: string; to: string; amount: number; currency: string }[] = [];

    const positiveBalances: { userId: string; amount: number }[] = [];
    const negativeBalances: { userId: string; amount: number }[] = [];

    for (const userId in balances) {
      if (balances[userId] > 0) {
        positiveBalances.push({ userId, amount: balances[userId] });
      } else if (balances[userId] < 0) {
        negativeBalances.push({ userId, amount: -balances[userId] });
      }
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
        amount,
        currency,
      });

      giver.amount -= amount;
      receiver.amount -= amount;

      if (giver.amount === 0) {
        i++;
      }

      if (receiver.amount === 0) {
        j++;
      }
    }

    return allTransactions;
  },
});
