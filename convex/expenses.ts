
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    groupId: v.id("groups"),
    payerId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    splitAmong: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }
    const expenseId = await ctx.db.insert("expenses", args);
    return { expenseId };
  },
});

export const getExpensesInGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();
  },
});

export const get = query({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.expenseId);
  },
});

export const update = mutation({
  args: {
    expenseId: v.id("expenses"),
    payerId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    splitAmong: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { expenseId, ...rest } = args;
    await ctx.db.patch(expenseId, rest);
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.expenseId);
  },
});
