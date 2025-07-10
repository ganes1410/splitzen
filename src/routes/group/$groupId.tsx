import { createFileRoute, useRouter, Outlet } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GroupSettingsForm } from "@/components/group-settings-form";
import { Settings } from "lucide-react";

export const Route = createFileRoute('/group/$groupId')({
  component: GroupPage,
  loader: async ({ params }) => {
    return { groupId: params.groupId } as { groupId: Id<"groups"> };
  },
  staticData: ({ loaderData }: { loaderData: { groupId: Id<"groups"> } }) => ({
    title: `Splitzen - Group ${loaderData.groupId}`,
  }),
})

function GroupPage() {
  const { groupId } = Route.useParams();
  const router = useRouter();
  const group = useQuery(api.groups.getGroup, {
    groupId: groupId as Id<"groups">,
  });

  // Redirect if group is not found (e.g., deleted)
  if (group === null) {
    router.navigate({ to: "/" });
    return null; // Or a loading/error state if preferred
  }
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
  const updateGroup = useMutation(api.groups.update);
  const updateGroupMembers = useMutation(api.groups.updateGroupMembers);

  const [showSettleForm, setShowSettleForm] = useState(false);
  const [settleFrom, setSettleFrom] = useState("");
  const [settleTo, setSettleTo] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");

  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [showDeleteExpenseConfirm, setShowDeleteExpenseConfirm] =
    useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Id<"expenses"> | null>(
    null
  );
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-primary">
          Group: {group?.name}
        </h1>
        <div className="flex space-x-2">
          <Button
            onClick={() =>
              router.navigate({ to: `/group/${groupId}/new-expense` })
            }
          >
            Add Expense
          </Button>
          <Button
            onClick={() => setShowDeleteGroupConfirm(true)}
            variant="destructive"
          >
            Delete Group
          </Button>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Group Settings</DialogTitle>
              </DialogHeader>
              {group && users && (
                <GroupSettingsForm
                  group={group}
                  allParticipants={users}
                  initialSelectedParticipants={users.map(u => u._id)}
                  onSubmit={async (data) => {
                    await updateGroup({ groupId: group._id, name: data.name, currency: data.currency });
                    await updateGroupMembers({ groupId: group._id, selectedParticipantIds: data.selectedParticipantIds });
                    setShowSettings(false);
                  }}
                  onCancel={() => setShowSettings(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <p className="text-lg text-muted-foreground">
        Invite Code:{" "}
        <span className="font-semibold text-foreground">
          {group?.inviteCode}
        </span>
      </p>

      <Outlet />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-primary">Expenses</h2>
        {expenses?.length === 0 ? (
          <p className="text-muted-foreground">No expenses yet.</p>
        ) : (
          <ul className="space-y-3">
            {expenses?.map((expense) => (
              <li
                key={expense._id}
                className="p-4 border rounded-lg shadow-sm flex justify-between items-center bg-card"
              >
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {getUserName(expense.payerId)} paid {expense.amount} for{" "}
                    {expense.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Split among:{" "}
                    {expense.splitAmong
                      .map((userId) => getUserName(userId))
                      .join(", ")}
                  </p>
                </div>
                <Button
                  onClick={() =>
                    router.navigate({
                      to: `/group/${groupId}/edit-expense/${expense._id}`,
                    })
                  }
                  variant="outline"
                  size="sm"
                  className="mr-2"
                >
                  Edit
                </Button>
                <Button
                  onClick={() =>
                    handleDeleteExpense(expense._id as Id<"expenses">)
                  }
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-primary">Balances</h2>
        {balances?.length === 0 ? (
          <p className="text-muted-foreground">No outstanding balances.</p>
        ) : (
          <ul className="space-y-3">
            {balances?.map((balance, index) => (
              <li
                key={index}
                className="p-4 border rounded-lg shadow-sm bg-card"
              >
                <p className="text-lg text-foreground">
                  <span className="font-semibold">
                    {getUserName(balance.from)}
                  </span>{" "}
                  owes{" "}
                  <span className="font-semibold">
                    {getUserName(balance.to)}
                  </span>{" "}
                  <span className="font-semibold">
                    {balance.amount.toFixed(2)} {balance.currency}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <Button
          onClick={() => setShowSettleForm(!showSettleForm)}
          className="w-full"
        >
          {showSettleForm ? "Cancel Settle Up" : "Settle Up"}
        </Button>

        {showSettleForm && (
          <form
            onSubmit={handleSettle}
            className="space-y-4 p-6 border rounded-lg shadow-md bg-card"
          >
            <h3 className="text-xl font-bold text-primary">
              Record Settlement
            </h3>
            <div>
              <label
                htmlFor="settle-from"
                className="block text-sm font-medium text-foreground mb-1"
              >
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
              <label
                htmlFor="settle-to"
                className="block text-sm font-medium text-foreground mb-1"
              >
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
                className="block text-sm font-medium text-foreground mb-1"
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
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="settle-note"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Note (Optional)
              </label>
              <Input
                id="settle-note"
                name="settle-note"
                value={settleNote}
                onChange={(e) => setSettleNote(e.target.value)}
                placeholder="Add a note"
                className="w-full"
              />
            </div>

            <Button type="submit" className="w-full">
              Record Settlement
            </Button>
          </form>
        )}
      </section>

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
