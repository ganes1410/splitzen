import { createFileRoute, useRouter, Outlet } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";

type Expense = Doc<"expenses">;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GroupSettingsForm } from "@/components/group-settings-form";
import { ExpenseForm } from "@/components/expense-form";
import { SettleForm } from "@/components/settle-form";
import { Settings, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { getCurrencySymbol } from "@/lib/currencies";

export const Route = createFileRoute("/group/$groupId")({
  component: GroupPage,
  loader: async ({ params }) => {
    return { groupId: params.groupId } as { groupId: Id<"groups"> };
  },
  staticData: ({ loaderData }: { loaderData: { groupId: Id<"groups"> } }) => ({
    title: `Splitzen - Group ${loaderData.groupId}`,
  }),
});

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
  const createExpense = useMutation(api.expenses.create);
  const updateExpense = useMutation(api.expenses.update);

  const [showSettleForm, setShowSettleForm] = useState(false);

  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [showDeleteExpenseConfirm, setShowDeleteExpenseConfirm] =
    useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Id<"expenses"> | null>(
    null
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | undefined>(
    undefined
  );
  const [expandedExpenseIds, setExpandedExpenseIds] = useState<
    Id<"expenses">[]
  >([]);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getUserName = (userId: string) => {
    return users?.find((user) => user._id === userId)?.name || "Unknown";
  };

  const handleSettle = async (data: {
    from: Id<"users">;
    to: Id<"users">;
    amount: number;
    note?: string;
  }) => {
    await createSettlement({
      groupId: groupId as Id<"groups">,
      ...data,
    });
    setShowSettleForm(false);
  };

  return (
    <div className="flex flex-col sm:ml-40 px-3">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-primary">{group?.name}</h1>
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              setCurrentExpense(undefined);
              setShowExpenseDialog(true);
            }}
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
                  initialSelectedParticipants={users.map((u) => u._id)}
                  onSubmit={async (data) => {
                    await updateGroup({
                      groupId: group._id,
                      name: data.name,
                      currency: data.currency,
                    });
                    await updateGroupMembers({
                      groupId: group._id,
                      selectedParticipantIds: data.selectedParticipantIds,
                    });
                    setShowSettings(false);
                  }}
                  onCancel={() => setShowSettings(false)}
                />
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {currentExpense ? "Edit Expense" : "Add Expense"}
                </DialogTitle>
              </DialogHeader>
              <ExpenseForm
                groupId={groupId as Id<"groups">}
                initialData={currentExpense}
                onSubmit={async (data) => {
                  if (data.expenseId) {
                    await updateExpense({
                      ...data,
                      expenseId: data.expenseId as Id<"expenses">,
                    });
                  } else {
                    await createExpense({
                      groupId: groupId as Id<"groups">,
                      ...data,
                    });
                  }
                  setShowExpenseDialog(false);
                  setCurrentExpense(undefined);
                }}
                submitButtonText={
                  currentExpense ? "Update Expense" : "Add Expense"
                }
                onCancel={() => {
                  setShowExpenseDialog(false);
                  setCurrentExpense(undefined);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="text-md text-muted-foreground flex items-center">
        Invite Code:{" "}
        <span className="font-semibold text-foreground ml-2">
          {group?.inviteCode}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="ml-2 h-8 w-8"
        >
          {copied ? (
            <span className="text-xs">Copied</span>
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Outlet />

      <section className="space-y-4 border-t mt-8 pt-4">
        <h2 className="text-2xl font-bold text-primary">Expenses</h2>
        {expenses?.length === 0 ? (
          <p className="text-muted-foreground">No expenses yet.</p>
        ) : (
          <ul className="space-y-3">
            {expenses?.map((expense) => (
              <li
                key={expense._id}
                className="p-4 border rounded-lg shadow-sm flex flex-col bg-card"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setExpandedExpenseIds((prev) =>
                          prev.includes(expense._id)
                            ? prev.filter((id) => id !== expense._id)
                            : [...prev, expense._id]
                        )
                      }
                    >
                      {expandedExpenseIds.includes(expense._id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {getUserName(expense.payerId)} paid{" "}
                        {getCurrencySymbol(group?.currency)}
                        {expense.amount} for {expense.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.date || "").toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setCurrentExpense(expense);
                        setShowExpenseDialog(true);
                      }}
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
                  </div>
                </div>
                {expandedExpenseIds.includes(expense._id) && (
                  <div className="mt-4 pt-4 border-t border-dashed">
                    <h4 className="text-md font-semibold mb-2">
                      Split Details:
                    </h4>
                    <ul className="space-y-1">
                      {expense.splitAmong.map((userId) => {
                        const user = users?.find((u) => u._id === userId);
                        const share =
                          expense.amount / expense.splitAmong.length;
                        return (
                          <li
                            key={userId}
                            className="flex justify-between text-sm text-muted-foreground"
                          >
                            <span>{user?.name || "Unknown"}</span>
                            <span>
                              {getCurrencySymbol(group?.currency)}
                              {share.toFixed(2)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 border-t mt-8 pt-4">
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

      <section className="space-y-4 mt-8 pt-4">
        <Dialog open={showSettleForm} onOpenChange={setShowSettleForm}>
          <DialogTrigger asChild>
            <Button className="w-full">Settle Up</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Settlement</DialogTitle>
            </DialogHeader>
            {users && (
              <SettleForm
                users={users}
                onSubmit={handleSettle}
                onCancel={() => setShowSettleForm(false)}
              />
            )}
          </DialogContent>
        </Dialog>
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
