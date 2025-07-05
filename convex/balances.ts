
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getBalances = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    const balances: { [key: string]: number } = {};
    users.forEach((user) => (balances[user._id] = 0));

    expenses.forEach((expense) => {
      balances[expense.payerId] += expense.amount;
      const splitAmount = expense.amount / expense.splitAmong.length;
      expense.splitAmong.forEach((userId) => {
        balances[userId] -= splitAmount;
      });
    });

    const transactions: { from: string; to: string; amount: number }[] = [];
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

      transactions.push({
        from: receiver.userId,
        to: giver.userId,
        amount,
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

    return transactions;
  },
});
