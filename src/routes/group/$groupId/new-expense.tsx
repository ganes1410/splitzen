import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";

import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/group/$groupId/new-expense")({
  component: NewExpense,
});

function NewExpense() {
  console.log("NewExpense component mounted");
  const { groupId } = Route.useParams();
  const router = useRouter();
  const createExpense = useMutation(api.expenses.create);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [payerId, setPayerId] = useState("");
  const [splitWith, setSplitWith] = useState<Id<"users">[]>([]);

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

  console.log("Users data:", users);

  if (users === undefined) {
    return <div>Loading users...</div>;
  }

  if (users === null) {
    return <div>Error loading users.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called");
    if (!users) {
      console.log("Users not loaded yet.");
      return;
    }
    if (!payerId) {
      console.log("Payer not selected.");
      alert("Please select a payer.");
      return;
    }
    if (splitWith.length === 0) {
      console.log("No one selected to split with.");
      alert("Please select at least one person to split the expense with.");
      return;
    }

    try {
      await createExpense({
        groupId: groupId as Id<"groups">,
        payerId: payerId as Id<"users">,
        amount: parseFloat(amount),
        description,
        splitAmong: splitWith,
      });
      console.log("Expense created successfully.");
      router.navigate({ to: `/group/${groupId}` });
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Error creating expense. Check console for details.");
    }
  };

  const isFormValid =
    users && payerId && amount && description && splitWith.length > 0;

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-2xl font-bold">Add Expense to Group </h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label htmlFor="amount" className="block text-lg font-medium">
            Amount
          </label>
          <Input
            id="amount"
            name="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-lg font-medium">
            Description
          </label>
          <Input
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
          />
        </div>

        <div>
          <label htmlFor="payer" className="block text-lg font-medium">
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
        </div>

        <div>
          <label className="block text-lg font-medium">Split Among</label>
          <div className="flex flex-wrap gap-2">
            {users?.map((user) => (
              <div key={user._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`split-${user._id}`}
                  checked={splitWith.includes(user._id)}
                  onChange={() => handleSplitWithChange(user._id)}
                />
                <label htmlFor={`split-${user._id}`}>{user.name}</label>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
}
