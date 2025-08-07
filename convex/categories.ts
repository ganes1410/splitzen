import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCategoriesInGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", args);
  },
});
