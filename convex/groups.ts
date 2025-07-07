
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { groupName: v.string(), userName: v.string(), userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let userRecordId: any;
    if (!userId) {
      const newUserId = Math.random().toString(36).substring(2, 15);
      const newUser = await ctx.db.insert("users", { name: args.userName, userId: newUserId });
      userId = newUserId;
      userRecordId = newUser._id;
    } else {
      const existingUser = await ctx.db.query("users").withIndex("by_userId", q => q.eq("userId", userId)).unique();
      if (existingUser) {
        userRecordId = existingUser._id;
      } else {
        const newUser = await ctx.db.insert("users", { name: args.userName, userId });
        userRecordId = newUser._id;
      }
    }

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const groupId = await ctx.db.insert("groups", { name: args.groupName, inviteCode });

    await ctx.db.insert("members", { userId: userRecordId, groupId });

    return { groupId, inviteCode, userId };
  },
});

export const getGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  },
});

export const getGroupsForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_userId", q => q.eq("userId", args.userId)).unique();
    if (!user) {
      return [];
    }
    const memberships = await ctx.db.query("members").filter(q => q.eq(q.field("userId"), user._id)).collect();
    const groupIds = memberships.map(m => m.groupId);
    const groups = await Promise.all(groupIds.map(groupId => ctx.db.get(groupId)));
    return groups.filter(g => g !== null);
  },
});

export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    // Delete associated members
    const members = await ctx.db.query("members").filter(q => q.eq(q.field("groupId"), args.groupId)).collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
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
