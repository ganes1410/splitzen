
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getBalances = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
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

    const balances: { [currency: string]: { [userId: string]: number } } = {};

    expenses.forEach((expense) => {
      if (!balances[expense.currency as string]) {
        balances[expense.currency as string] = {};
        users.forEach((user) => {
          if (user) {
            balances[expense.currency as string][user._id] = 0;
          }
        });
      }
      balances[expense.currency as string][expense.payerId] += expense.amount;
      const splitAmount = expense.amount / expense.splitAmong.length;
      expense.splitAmong.forEach((userId) => {
        balances[expense.currency as string][userId] -= splitAmount;
      });
    });

    settlements.forEach((settlement) => {
      // Assuming all settlements are in the group's default currency for simplicity
      // You might need to handle multi-currency settlements differently
      const currency = Object.keys(balances)[0]; // Or determine currency from group settings
      if (currency) {
        balances[currency][settlement.from] += settlement.amount;
        balances[currency][settlement.to] -= settlement.amount;
      }
    });

    const allTransactions: { from: string; to: string; amount: number; currency: string }[] = [];

    for (const currency in balances) {
      const currencyBalances = balances[currency];
      const positiveBalances: { userId: string; amount: number }[] = [];
      const negativeBalances: { userId: string; amount: number }[] = [];

      for (const userId in currencyBalances) {
        if (currencyBalances[userId] > 0) {
          positiveBalances.push({ userId, amount: currencyBalances[userId] });
        } else if (currencyBalances[userId] < 0) {
          negativeBalances.push({ userId, amount: -currencyBalances[userId] });
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
    }

    return allTransactions;
  },
});
