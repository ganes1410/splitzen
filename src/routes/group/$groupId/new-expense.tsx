import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const expenseSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description cannot be empty"),
  payerId: z.string().min(1, "Please select a payer"),
  splitAmong: z.array(z.string()).min(1, "Please select at least one person to split with"),
});

export const Route = createFileRoute('/group/$groupId/new-expense')({
  component: NewExpense,
  staticData: ({ loaderData }: { loaderData: { groupId: string } }) => ({
    title: `Splitzen - Add Expense to ${loaderData.groupId}`,
  }),
})

function NewExpense() {
  const { groupId } = Route.useParams();
  const router = useRouter();
  const createExpense = useMutation(api.expenses.create);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [payerId, setPayerId] = useState("");
  const [splitWith, setSplitWith] = useState<Id<"users">[]>([]);
  const [errors, setErrors] = useState<z.ZodIssue[] | null>(null);

  const handleSplitWithChange = (userId: Id<"users">) => {
    setSplitWith((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const users = useQuery(api.users.getUsersInGroup, {
    groupId: groupId as Id<"groups">,
  });

  if (users === undefined) {
    return <div>Loading users...</div>;
  }

  if (users === null) {
    return <div>Error loading users.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    const result = expenseSchema.safeParse({
      amount: parseFloat(amount),
      description,
      payerId,
      splitAmong: splitWith,
    });

    if (!result.success) {
      setErrors(result.error.issues);
      return;
    }

    try {
      await createExpense({
        groupId: groupId as Id<"groups">,
        payerId: result.data.payerId as Id<"users">,
        amount: result.data.amount,
        description: result.data.description,
        splitAmong: result.data.splitAmong as Id<"users">[],
      });
      router.navigate({ to: `/group/${groupId}` });
    } catch (error) {
      console.error("Error creating expense:", error);
      setErrors([{ message: "Failed to create expense. Please try again." } as z.ZodIssue]);
    }
  };

  const isFormValid =
    users && payerId && amount && description && splitWith.length > 0;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center text-primary">
        Add Expense to Group{" "}
        <span className="text-muted-foreground">{groupId}</span>
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md mx-auto p-6 bg-card rounded-lg shadow-md"
      >
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Amount
          </label>
          <Input
            id="amount"
            name="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 25.50"
            className="w-full"
          />
          {errors?.find((e) => e.path[0] === "amount") && (
            <p className="text-destructive text-sm mt-1">
              {errors.find((e) => e.path[0] === "amount")?.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Description
          </label>
          <Input
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Dinner at Italian restaurant"
            className="w-full"
          />
          {errors?.find((e) => e.path[0] === "description") && (
            <p className="text-destructive text-sm mt-1">
              {errors.find((e) => e.path[0] === "description")?.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="payer"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Paid By
          </label>
          <select
            id="payer"
            name="payer"
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select Payer</option>
            {users?.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>
          {errors?.find((e) => e.path[0] === "payerId") && (
            <p className="text-destructive text-sm mt-1">
              {errors.find((e) => e.path[0] === "payerId")?.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Split Among
          </label>
          <div className="flex flex-wrap gap-3 p-2 border rounded-md bg-input/20">
            {users?.map((user) => (
              <div key={user._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`split-${user._id}`}
                  checked={splitWith.includes(user._id)}
                  onChange={() => handleSplitWithChange(user._id)}
                  className="form-checkbox h-4 w-4 text-primary rounded focus:ring-primary"
                />
                <label
                  htmlFor={`split-${user._id}`}
                  className="text-foreground text-sm"
                >
                  {user.name}
                </label>
              </div>
            ))}
          </div>
          {errors?.find((e) => e.path[0] === "splitAmong") && (
            <p className="text-destructive text-sm mt-1">
              {errors.find((e) => e.path[0] === "splitAmong")?.message}
            </p>
          )}
        </div>

        {errors && !errors.some(e => ["amount", "description", "payerId", "splitAmong"].includes(e.path[0] as string)) && (
          <p className="text-destructive text-sm mt-1">{errors[0].message}</p>
        )}

        <Button type="submit" disabled={!isFormValid} className="w-full">
          Add Expense
        </Button>
      </form>
    </div>
  );
}
