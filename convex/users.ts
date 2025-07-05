
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const join = mutation({
  args: { name: v.string(), inviteCode: v.string() },
  handler: async (ctx, args) => {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();

    if (!group) {
      throw new Error("Group not found");
    }

    const sessionId = Math.random().toString(36).substring(2, 15);
    const userId = await ctx.db.insert("users", {
      name: args.name,
      groupId: group._id,
      sessionId,
    });

    return { userId, sessionId, groupId: group._id };
  },
});

export const getUsersInGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();
  },
});
