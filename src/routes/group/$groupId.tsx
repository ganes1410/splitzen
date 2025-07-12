import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";

type Expense = Doc<"expenses">;
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/expense-form";
import { SettleForm } from "@/components/settle-form";
import { ExpenseChart } from "@/components/expense-chart";
import { Settings, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { getCurrencySymbol } from "@/lib/currencies";
import z from "zod";

export const Route = createFileRoute("/group/$groupId")({
  component: GroupPage,
  validateSearch: z.object({
    sortBy: z.string().optional().default("date"),
    filterBy: z.string().optional().default(""),
  }),
  loader: async ({ params }) => {
    return { groupId: params.groupId } as { groupId: Id<"groups"> };
  },
  staticData: ({ loaderData }: { loaderData: { groupId: Id<"groups"> } }) => ({
    title: `Splitzen - Group ${loaderData.groupId}`,
  }),
});

function GroupHeader({
  group,
  groupId,
  setShowExpenseDialog,
  setCurrentExpense,
  setShowDeleteGroupConfirm,
  showExpenseDialog,
  setShowExpenseDialog: setShowExpenseDialogState,
  currentExpense,
  setCurrentExpense: setCurrentExpenseState,
}: {
  group: Doc<"groups"> | null;
  groupId: string;

  setShowExpenseDialog: (show: boolean) => void;
  setCurrentExpense: (expense: Expense | undefined) => void;
  setShowDeleteGroupConfirm: (show: boolean) => void;
  showExpenseDialog: boolean;
  currentExpense: Expense | undefined;
}) {
  const [copied, setCopied] = useState(false);
  const createExpense = useMutation(api.expenses.create);
  const updateExpense = useMutation(api.expenses.update);
  const router = useRouter();

  const handleCopy = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className=" sticky top-1 bg-background py-4">
      <div className="flex justify-between items-center mb-3">
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
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              router.navigate({
                to: "/$groupId/settings",
                params: { groupId },
              })
            }
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Dialog
            open={showExpenseDialog}
            onOpenChange={setShowExpenseDialogState}
          >
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
                  setShowExpenseDialogState(false);
                  setCurrentExpenseState(undefined);
                }}
                submitButtonText={
                  currentExpense ? "Update Expense" : "Add Expense"
                }
                onCancel={() => {
                  setShowExpenseDialogState(false);
                  setCurrentExpenseState(undefined);
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
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function ExpensesSection({
  expenses,
  group,
  users,
  handleDeleteExpense,
  setCurrentExpense,
  setShowExpenseDialog,
  sortBy,
  filterBy,
  setSortBy,
  setFilterBy,
}: {
  expenses: Expense[] | undefined;
  group: Doc<"groups"> | null;
  users: Doc<"users">[] | undefined;
  handleDeleteExpense: (expenseId: Id<"expenses">) => void;
  setCurrentExpense: (expense: Expense) => void;
  setShowExpenseDialog: (show: boolean) => void;
  sortBy: string;
  filterBy: string;
  setSortBy: (sortBy: string) => void;
  setFilterBy: (filterBy: string) => void;
}) {
  const [expandedExpenseIds, setExpandedExpenseIds] = useState<
    Id<"expenses">[]
  >([]);

  const getUserName = (userId: string) => {
    return users?.find((user) => user._id === userId)?.name || "Unknown";
  };

  const sortedAndFilteredExpenses = useMemo(() => {
    let filtered = expenses;
    if (filterBy) {
      filtered = expenses?.filter((expense) =>
        expense.description.toLowerCase().includes(filterBy.toLowerCase())
      );
    }

    if (!filtered) return [];

    return filtered.sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.date as string).getTime() -
          new Date(a.date as string).getTime()
        );
      } else if (sortBy === "amount") {
        return b.amount - a.amount;
      }
      return 0;
    });
  }, [expenses, sortBy, filterBy]);

  return (
    <section className="space-y-4 border-t mt-4 pt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary">Expenses</h2>
        <div className="flex gap-6 ">
          <Input
            type="text"
            placeholder="Filter by description..."
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="w-48 h-auto"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>
      {sortedAndFilteredExpenses?.length === 0 ? (
        <div className="text-muted-foreground">
          <p className="mb-2">No expenses yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedAndFilteredExpenses?.map((expense) => (
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
                  <div className="flex flex-col gap-1 w-full">
                    <p className="text-base text-foreground">
                      <span className="font-semibold">
                        {getUserName(expense.payerId)}
                      </span>{" "}
                      paid{" "}
                      <span className="font-semibold text-primary">
                        {getCurrencySymbol(group?.currency)}
                        {expense.amount.toFixed(2)}
                      </span>{" "}
                      for <span className="italic">{expense.description}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
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
                  <h4 className="text-md font-semibold mb-2">Split Details</h4>
                  <ul className="flex flex-col gap-2">
                    {expense.splitAmong.map((userId) => {
                      const user = users?.find((u) => u._id === userId);
                      const share = expense.amount / expense.splitAmong.length;
                      return (
                        <li
                          key={userId}
                          className="flex items-center text-sm text-muted-foreground w-50 justify-between"
                        >
                          <span>{user?.name || "Unknown"} </span>
                          <span className="text-primary font-semibold ml-3">
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
  );
}

function BalancesSection({
  balances,
  users,
  setShowSettleForm,
  setPrefillSettleForm,
}: {
  balances:
    | {
        from: string;
        to: string;
        amount: number;
        currency: string;
      }[]
    | undefined;
  users: Doc<"users">[] | undefined;
  setShowSettleForm: (show: boolean) => void;
  setPrefillSettleForm: (
    data:
      | {
          from: Id<"users">;
          to: Id<"users">;
          amount: number;
        }
      | undefined
  ) => void;
}) {
  const getUserName = (userId: string) => {
    return users?.find((user) => user._id === userId)?.name || "Unknown";
  };

  return (
    <section className="space-y-4 border-t pt-6">
      <h2 className="text-2xl font-bold text-primary">Balances</h2>

      {balances?.length === 0 ? (
        <p className="text-muted-foreground italic">No outstanding balances.</p>
      ) : (
        <ul className="space-y-3">
          {balances?.map((balance, index) => (
            <li
              key={index}
              className="p-4 border rounded-lg shadow-sm bg-card flex items-center justify-between"
            >
              <div className="text-base text-foreground">
                <span className="font-semibold">
                  {getUserName(balance.from)}
                </span>{" "}
                owes{" "}
                <span className="font-semibold">{getUserName(balance.to)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold text-primary">
                  {getCurrencySymbol(balance.currency)}
                  {balance.amount.toFixed(2)}
                </div>
                <Button
                  onClick={() => {
                    setPrefillSettleForm({
                      from: balance.from as Id<"users">,
                      to: balance.to as Id<"users">,
                      amount: balance.amount,
                    });
                    setShowSettleForm(true);
                  }}
                  size="sm"
                >
                  Settle Up
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GroupPage() {
  const { groupId } = Route.useParams();
  const router = useRouter();
  const { sortBy, filterBy } = Route.useSearch();

  const setSortBy = (newSortBy: string) => {
    router.navigate({
      to: `/group/${groupId}`,
      search: (prev) => ({
        ...prev,
        sortBy: newSortBy,
      }),
      replace: true,
    });
  };

  const setFilterBy = (newFilterBy: string) => {
    router.navigate({
      to: `/group/${groupId}`,
      search: (prev) => ({
        ...prev,
        filterBy: newFilterBy,
      }),
      replace: true,
    });
  };
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
  const [prefillSettleForm, setPrefillSettleForm] = useState<
    | {
        from: Id<"users">;
        to: Id<"users">;
        amount: number;
      }
    | undefined
  >(undefined);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [showDeleteExpenseConfirm, setShowDeleteExpenseConfirm] =
    useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Id<"expenses"> | null>(
    null
  );
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | undefined>(
    undefined
  );

  // Loading state
  if (
    group === undefined ||
    expenses === undefined ||
    users === undefined ||
    balances === undefined
  ) {
    return (
      <div className="flex flex-col sm:ml-40 px-3 py-4">
        Loading group data...
      </div>
    );
  }

  // Redirect if group is not found (e.g., deleted)
  if (group === null) {
    router.navigate({ to: "/" });
    return null; // Or a loading/error state if preferred
  }

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
      <GroupHeader
        group={group}
        groupId={groupId}
        setShowExpenseDialog={setShowExpenseDialog}
        setCurrentExpense={setCurrentExpense}
        setShowDeleteGroupConfirm={setShowDeleteGroupConfirm}
        showExpenseDialog={showExpenseDialog}
        currentExpense={currentExpense}
      />

      {expenses && group && users && (
        <ExpenseChart expenses={expenses} group={group} users={users} />
      )}

      <ExpensesSection
        expenses={expenses}
        group={group}
        users={users}
        handleDeleteExpense={handleDeleteExpense}
        setCurrentExpense={setCurrentExpense}
        setShowExpenseDialog={setShowExpenseDialog}
        sortBy={sortBy}
        filterBy={filterBy}
        setSortBy={setSortBy}
        setFilterBy={setFilterBy}
      />

      <BalancesSection
        balances={balances}
        users={users}
        setShowSettleForm={setShowSettleForm}
        setPrefillSettleForm={setPrefillSettleForm}
      />
      <section className="space-y-4 mt-8 py-4 flex items-center justify-center">
        <Dialog open={showSettleForm} onOpenChange={setShowSettleForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Settlement</DialogTitle>
            </DialogHeader>
            {users && (
              <SettleForm
                users={users}
                onSubmit={handleSettle}
                onCancel={() => {
                  setShowSettleForm(false);
                  setPrefillSettleForm(undefined);
                }}
                initialData={prefillSettleForm}
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
