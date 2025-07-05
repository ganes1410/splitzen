import { createFileRoute, useRouter, Outlet } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/group/$groupId")({
  component: GroupPage,
});

function GroupPage() {
  const { groupId } = Route.useParams();
  const router = useRouter();
  const group = useQuery(api.groups.getGroup, {
    groupId: groupId as Id<"groups">,
  });
  const expenses = useQuery(api.expenses.getExpensesInGroup, {
    groupId: groupId as Id<"groups">,
  });
  const users = useQuery(api.users.getUsersInGroup, {
    groupId: groupId as Id<"groups">,
  });
  const balances = useQuery(api.balances.getBalances, {
    groupId: groupId as Id<"groups">,
  });

  const createSettlement = useMutation(api.settlements.create);
  const deleteGroup = useMutation(api.groups.deleteGroup);
  const deleteExpense = useMutation(api.expenses.deleteExpense);

  const [showSettleForm, setShowSettleForm] = useState(false);
  const [settleFrom, setSettleFrom] = useState("");
  const [settleTo, setSettleTo] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");

  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [showDeleteExpenseConfirm, setShowDeleteExpenseConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Id<"expenses"> | null>(null);

  const handleDeleteGroup = async () => {
    await deleteGroup({ groupId: groupId as Id<"groups"> });
    router.navigate({ to: "/" });
  };

  const handleDeleteExpense = async (expenseId: Id<"expenses">) => {
    setExpenseToDelete(expenseId);
    setShowDeleteExpenseConfirm(true);
  };

  const confirmDeleteExpense = async () => {
    if (expenseToDelete) {
      await deleteExpense({ expenseId: expenseToDelete });
      setExpenseToDelete(null);
      setShowDeleteExpenseConfirm(false);
    }
  };

  const getUserName = (userId: string) => {
    return users?.find((user) => user._id === userId)?.name || "Unknown";
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSettlement({
      groupId: groupId as Id<"groups">,
      from: settleFrom as Id<"users">,
      to: settleTo as Id<"users">,
      amount: parseFloat(settleAmount),
      note: settleNote || undefined,
    });
    setShowSettleForm(false);
    setSettleFrom("");
    setSettleTo("");
    setSettleAmount("");
    setSettleNote("");
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-2xl font-bold">Group: {group?.name}</h3>
      <p className="text-gray-600">
        Invite Code: <span className="font-semibold">{group?.inviteCode}</span>
      </p>

      <Button onClick={() => router.navigate({ to: `/group/${groupId}/new-expense` })}>Add Expense</Button>
      <Button onClick={() => setShowDeleteGroupConfirm(true)} className="bg-red-500 hover:bg-red-600 text-white">Delete Group</Button>
      <Outlet />
      {expenses?.length === 0 ? (
        <p className="text-gray-500">No expenses yet.</p>
      ) : (
        <ul className="space-y-2">
          {expenses?.map((expense) => (
            <li key={expense._id} className="p-2 border rounded-md flex justify-between items-center">
              <div>
                <span className="font-semibold">
                  {getUserName(expense.payerId)}
                </span>{" "}
                paid <span className="font-semibold">{expense.amount}</span> for{" "}
                {""}
                {expense.description} (split among:
                {expense.splitAmong
                  .map((userId) => getUserName(userId))
                  .join(", ")}
                )
              </div>
              <Button
                onClick={() => handleDeleteExpense(expense._id as Id<"expenses">)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      <h4 className="text-xl font-bold">Balances</h4>
      {balances?.length === 0 ? (
        <p className="text-gray-500">No outstanding balances.</p>
      ) : (
        <ul className="space-y-2">
          {balances?.map((balance, index) => (
            <li key={index} className="p-2 border rounded-md">
              <span className="font-semibold">{getUserName(balance.from)}</span>{" "}
              owes{" "}
              <span className="font-semibold">{getUserName(balance.to)}</span>{" "}
              <span className="font-semibold">{balance.amount.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}

      <Button onClick={() => setShowSettleForm(!showSettleForm)}>
        {showSettleForm ? "Cancel Settle Up" : "Settle Up"}
      </Button>

      {showSettleForm && (
        <form
          onSubmit={handleSettle}
          className="space-y-2 p-4 border rounded-md"
        >
          <h4 className="text-xl font-bold">Record Settlement</h4>
          <div>
            <label htmlFor="settle-from" className="block text-lg font-medium">
              From
            </label>
            <select
              id="settle-from"
              name="settle-from"
              value={settleFrom}
              onChange={(e) => setSettleFrom(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select User</option>
              {users?.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="settle-to" className="block text-lg font-medium">
              To
            </label>
            <select
              id="settle-to"
              name="settle-to"
              value={settleTo}
              onChange={(e) => setSettleTo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select User</option>
              {users?.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="settle-amount"
              className="block text-lg font-medium"
            >
              Amount
            </label>
            <Input
              id="settle-amount"
              name="settle-amount"
              type="number"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label htmlFor="settle-note" className="block text-lg font-medium">
              Note (Optional)
            </label>
            <Input
              id="settle-note"
              name="settle-note"
              value={settleNote}
              onChange={(e) => setSettleNote(e.target.value)}
              placeholder="Add a note"
            />
          </div>

          <Button type="submit">Record Settlement</Button>
        </form>
      )}

      <ConfirmDialog
        open={showDeleteGroupConfirm}
        onOpenChange={setShowDeleteGroupConfirm}
        title="Confirm Group Deletion"
        description="Are you sure you want to delete this group? This action cannot be undone and all associated data (users, expenses, settlements) will be permanently removed."
        onConfirm={handleDeleteGroup}
        confirmText="Delete Group"
      />

      <ConfirmDialog
        open={showDeleteExpenseConfirm}
        onOpenChange={setShowDeleteExpenseConfirm}
        title="Confirm Expense Deletion"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        onConfirm={confirmDeleteExpense}
        confirmText="Delete Expense"
      />
    </div>
  );
}
