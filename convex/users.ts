
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = Math.random().toString(36).substring(2, 15);
    const _id = await ctx.db.insert("users", { name: args.name, userId });
    return { userId, _id };
  },
});

export const join = mutation({
  args: { name: v.string(), inviteCode: v.string(), userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();

    if (!group) {
      throw new Error("Group not found");
    }

    let userId = args.userId;
    let userRecordId: any;

    if (userId) {
      const existingUser = await ctx.db.query("users").withIndex("by_userId", q => q.eq("userId", userId as string)).unique();
      if (existingUser) {
        userRecordId = existingUser._id;
      } else {
        userRecordId = await ctx.db.insert("users", { name: args.name, userId });
      }
    } else {
      const newUserId = Math.random().toString(36).substring(2, 15);
      userRecordId = await ctx.db.insert("users", { name: args.name, userId: newUserId });
      userId = newUserId;
    }

    const existingMembership = await ctx.db.query("members")
      .filter(q => q.eq(q.field("userId"), userRecordId))
      .filter(q => q.eq(q.field("groupId"), group._id))
      .unique();

    if (existingMembership) {
      throw new Error("You are already a member of this group.");
    }

    await ctx.db.insert("members", { userId: userRecordId, groupId: group._id });

    return { userId, groupId: group._id };
  },
});

export const getUsersInGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const members = await ctx.db.query("members").filter(q => q.eq(q.field("groupId"), args.groupId)).collect();
    const userIds = members.map(m => m.userId);
    const users = await Promise.all(userIds.map(userId => ctx.db.get(userId)));
    return users.filter(u => u !== null);
  },
});

export const getMembership = query({
  args: { userId: v.string(), groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_userId", q => q.eq("userId", args.userId)).unique();
    if (!user) {
      return null;
    }
    const membership = await ctx.db.query("members")
      .filter(q => q.eq(q.field("userId"), user._id))
      .filter(q => q.eq(q.field("groupId"), args.groupId))
      .unique();
    return membership;
  },
});
