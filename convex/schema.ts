
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  groups: defineTable({
    name: v.string(),
    inviteCode: v.string(),
  }).index("by_inviteCode", ["inviteCode"]),
  users: defineTable({
    name: v.string(),
    groupId: v.id("groups"),
    sessionId: v.string(),
  }),
  expenses: defineTable({
    groupId: v.id("groups"),
    payerId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    splitAmong: v.array(v.id("users")),
  }),
  settlements: defineTable({
    groupId: v.id("groups"),
    from: v.id("users"),
    to: v.id("users"),
    amount: v.number(),
    note: v.optional(v.string()),
  }),
});
