
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    groupId: v.id("groups"),
    from: v.id("users"),
    to: v.id("users"),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    await ctx.db.insert("settlements", {
      groupId: args.groupId,
      from: args.from,
      to: args.to,
      amount: args.amount,
      note: args.note,
    });

    // Update balances
    const fromBalance = await ctx.db
      .query("balances")
      .withIndex("by_user_group", (q) =>
        q.eq("userId", args.from).eq("groupId", args.groupId)
      )
      .first();

    if (fromBalance) {
      await ctx.db.patch(fromBalance._id, {
        balance: fromBalance.balance + args.amount,
      });
    } else {
      await ctx.db.insert("balances", {
        userId: args.from,
        groupId: args.groupId,
        balance: args.amount,
      });
    }

    const toBalance = await ctx.db
      .query("balances")
      .withIndex("by_user_group", (q) =>
        q.eq("userId", args.to).eq("groupId", args.groupId)
      )
      .first();

    if (toBalance) {
      await ctx.db.patch(toBalance._id, {
        balance: toBalance.balance - args.amount,
      });
    } else {
      await ctx.db.insert("balances", {
        userId: args.to,
        groupId: args.groupId,
        balance: -args.amount,
      });
    }
  },
});
