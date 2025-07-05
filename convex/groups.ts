
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { groupName: v.string(), userName: v.string() },
  handler: async (ctx, args) => {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const groupId = await ctx.db.insert("groups", { name: args.groupName, inviteCode });
    const sessionId = Math.random().toString(36).substring(2, 15);
    await ctx.db.insert("users", {
      name: args.userName,
      groupId,
      sessionId,
    });
    return { groupId, inviteCode, sessionId };
  },
});

export const getGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  },
});

export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    // Delete associated users
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }

    // Delete associated expenses
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();
    for (const expense of expenses) {
      await ctx.db.delete(expense._id);
    }

    // Delete associated settlements
    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();
    for (const settlement of settlements) {
      await ctx.db.delete(settlement._id);
    }

    // Finally, delete the group itself
    await ctx.db.delete(args.groupId);
  },
});
