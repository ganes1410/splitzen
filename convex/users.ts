import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = Math.random().toString(36).substring(2, 15);
    const _id = await ctx.db.insert("users", { name: args.name, userId });
    return { userId, _id };
  },
});

export const addUserToGroup = mutation({
  args: { name: v.string(), groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const userId = Math.random().toString(36).substring(2, 15);
    const userRecordId = await ctx.db.insert("users", {
      name: args.name,
      userId,
    });

    await ctx.db.insert("members", {
      userId: userRecordId,
      groupId: args.groupId,
    });

    return { userId, userRecordId };
  },
});

export const join = mutation({
  args: {
    name: v.string(),
    inviteCode: v.string(),
    userId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();

    if (!group) {
      throw new Error("Group not found");
    }

    let userId: string | null = args.userId;
    let userRecordId: any;

    if (userId) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", userId as string))
        .unique();
      if (existingUser) {
        userRecordId = existingUser._id;
      } else {
        userRecordId = await ctx.db.insert("users", {
          name: args.name,
          userId,
        });
      }
    } else {
      const newUserId = Math.random().toString(36).substring(2, 15);
      userRecordId = await ctx.db.insert("users", {
        name: args.name,
        userId: newUserId,
      });
      userId = newUserId;
    }

    const existingMembership = await ctx.db
      .query("members")
      .filter((q) => q.eq(q.field("userId"), userRecordId))
      .filter((q) => q.eq(q.field("groupId"), group._id))
      .unique();

    if (existingMembership) {
      throw new Error("You are already a member of this group.");
    }

    await ctx.db.insert("members", {
      userId: userRecordId,
      groupId: group._id,
    });

    return { userId, groupId: group._id };
  },
});

export const getUsersInGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();
    const userIds = members.map((m) => m.userId);
    const users = await Promise.all(
      userIds.map((userId) => ctx.db.get(userId))
    );
    return users.filter((u) => u !== null);
  },
});

export const getMembership = query({
  args: { userId: v.string(), groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!user) {
      return null;
    }
    const membership = await ctx.db
      .query("members")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .unique();
    return membership;
  },
});

export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },
});

export const removeUserFromGroup = mutation({
  args: { userId: v.id("users"), groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const authenticatedUserConvexId = identity?.subject; // This is the Convex user ID (string) from auth provider

    // Get the user record corresponding to args.userId
    const userBeingRemoved = await ctx.db.get(args.userId);

    if (!userBeingRemoved) {
      // User record not found, nothing to do
      return;
    }

    const membership = await ctx.db
      .query("members")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .unique();

    if (membership) {
      await ctx.db.delete(membership._id);

      // Check if the user has any other memberships
      const remainingMemberships = await ctx.db
        .query("members")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .collect();

      // Check if the user has any pending balances in this group
      const userBalance = await ctx.runQuery(
        api.balances.getUserBalanceInGroup,
        {
          userId: args.userId,
          groupId: args.groupId,
        }
      );

      const EPSILON = 0.0001; // A small value to account for floating-point inaccuracies

      if (Math.abs(userBalance) > EPSILON) {
        throw new ConvexError(
          "Cannot remove user with pending balances. Please settle all balances first."
        );
      }

      await ctx.db.delete(membership._id);
      // If no other memberships, and the user being removed is NOT the authenticated user, then delete the user record.
      // We compare userBeingRemoved.userId (the string ID from the auth provider) with authenticatedUserConvexId
      if (
        remainingMemberships.length === 0 &&
        userBeingRemoved.userId !== authenticatedUserConvexId
      ) {
        await ctx.db.delete(args.userId);
      } else if (
        remainingMemberships.length === 0 &&
        userBeingRemoved.userId === authenticatedUserConvexId
      ) {
        // This is the authenticated user and their last group. Do not delete their user record.
        console.log(
          `Prevented deletion of authenticated user ${userBeingRemoved._id} from their last group.`
        );
      }
    }
  },
});
