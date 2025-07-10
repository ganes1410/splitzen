
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { groupName: v.string(), userName: v.string(), currency: v.string(), userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let currentUserId: string;
    let userRecordId: any;

    if (args.userId) {
      currentUserId = args.userId;
      const existingUser = await ctx.db.query("users").withIndex("by_userId", q => q.eq("userId", currentUserId)).unique();
      if (existingUser) {
        userRecordId = existingUser._id;
      } else {
        const newUserConvexId = await ctx.db.insert("users", { name: args.userName, userId: currentUserId });
        userRecordId = newUserConvexId;
      }
    } else {
      currentUserId = Math.random().toString(36).substring(2, 15);
      const newUserConvexId = await ctx.db.insert("users", { name: args.userName, userId: currentUserId });
      userRecordId = newUserConvexId;
    }

    if (!userRecordId) {
      throw new Error("Failed to get or create user record ID.");
    }

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const groupId = await ctx.db.insert("groups", { name: args.groupName, inviteCode, currency: args.currency });

    await ctx.db.insert("members", { userId: userRecordId, groupId });

    return { groupId, inviteCode, userId: currentUserId };
  },
});

export const getGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  },
});

export const getGroupbyInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();
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

export const update = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const { groupId, ...rest } = args;
    await ctx.db.patch(groupId, rest);
  },
});

export const updateUsers = mutation({
  args: {
    users: v.array(v.object({ _id: v.id("users"), name: v.string() })),
  },
  handler: async (ctx, args) => {
    for (const user of args.users) {
      const { _id, ...rest } = user;
      await ctx.db.patch(_id, rest);
    }
  },
});

export const updateGroupMembers = mutation({
  args: {
    groupId: v.id("groups"),
    selectedParticipantIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const existingMembers = await ctx.db
      .query("members")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    const existingMemberIds = new Set(existingMembers.map((m) => m.userId));
    const newParticipantIds = new Set(args.selectedParticipantIds);

    // Add new members
    for (const participantId of newParticipantIds) {
      if (!existingMemberIds.has(participantId)) {
        await ctx.db.insert("members", { userId: participantId, groupId: args.groupId });
      }
    }

    // Remove unselected members
    for (const existingMember of existingMembers) {
      if (!newParticipantIds.has(existingMember.userId)) {
        await ctx.db.delete(existingMember._id);
      }
    }
  },
});
