import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { useMutation, useQueries, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";

type Expense = Doc<"expenses"> & { category?: Doc<"categories"> | null };
import { useState, useMemo, lazy, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import z from "zod";
import { GroupHeader } from "@/components/group/group-header";
import { ExpensesSection } from "@/components/group/expenses-section";
import { BalancesSection } from "@/components/group/balances-section";
import { GroupPageSkeleton } from "@/components/group/group-skeleton";

const SettleForm = lazy(() =>
  import("@/components/settle-form").then((m) => ({ default: m.SettleForm }))
);
const ConfirmDialog = lazy(() =>
  import("@/components/ui/confirm-dialog").then((m) => ({
    default: m.ConfirmDialog,
  }))
);
const ExpenseChart = lazy(() =>
  import("@/components/expense-chart").then((m) => ({
    default: m.ExpenseChart,
  }))
);

export const Route = createFileRoute("/group/$groupId")({
  component: GroupPage,
  validateSearch: z.object({
    sortBy: z.string().optional().default("dateDesc"),
    filterBy: z.string().optional().default(""),
  }),
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
  const categories = useQuery(api.categories.getCategoriesInGroup, {
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
      note?: string;
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

  const expensesWithCategories = useMemo(() => {
    if (!expenses || !categories) return [];
    return expenses.map((expense) => ({
      ...expense,
      category: categories.find((c) => c._id === expense.categoryId),
    }));
  }, [expenses, categories]);

  // Loading state
  if (
    group === undefined ||
    expenses === undefined ||
    users === undefined ||
    balances === undefined ||
    categories === undefined
  ) {
    return <GroupPageSkeleton />;
  }

  // Redirect if group is not found (e.g., deleted)
  if (group === null) {
    router.navigate({ to: "/" });
    return null;
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
    <div className="flex flex-col sm:ml-40 px-4 py-6 max-w-6xl mx-auto w-full">
      <GroupHeader
        group={group}
        groupId={groupId}
        setShowExpenseDialog={setShowExpenseDialog}
        setCurrentExpense={setCurrentExpense}
        setShowDeleteGroupConfirm={setShowDeleteGroupConfirm}
        showExpenseDialog={showExpenseDialog}
        setShowExpenseDialogState={setShowExpenseDialog}
        currentExpense={currentExpense}
      />

      {expensesWithCategories && group && users && categories && (
        <div className="mb-6">
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <ExpenseChart
              expenses={expensesWithCategories}
              group={group}
              users={users}
              categories={categories}
            />
          </Suspense>
        </div>
      )}

      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <ExpensesSection
            expenses={expensesWithCategories}
            group={group}
            users={users}
            categories={categories}
            handleDeleteExpense={handleDeleteExpense}
            setCurrentExpense={setCurrentExpense}
            setShowExpenseDialog={setShowExpenseDialog}
            sortBy={sortBy}
            filterBy={filterBy}
            setSortBy={setSortBy}
            setFilterBy={setFilterBy}
          />
        </div>
        <div className="lg:col-span-1">
          <BalancesSection
            balances={balances}
            users={users}
            setShowSettleForm={setShowSettleForm}
            setPrefillSettleForm={setPrefillSettleForm}
          />
        </div>
      </div>

      <section className="space-y-4 mt-8 py-4 flex items-center justify-center">
        <Dialog open={showSettleForm} onOpenChange={setShowSettleForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Settlement</DialogTitle>
            </DialogHeader>
            <Suspense
              fallback={
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Skeleton className="h-11 flex-1" />
                    <Skeleton className="h-11 flex-1" />
                  </div>
                </div>
              }
            >
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
            </Suspense>
          </DialogContent>
        </Dialog>
      </section>

      <Suspense fallback={null}>
        <ConfirmDialog
          open={showDeleteGroupConfirm}
          onOpenChange={setShowDeleteGroupConfirm}
          title="Confirm Group Deletion"
          description="Are you sure you want to delete this group? This action cannot be undone and all associated data (users, expenses, settlements) will be permanently removed."
          onConfirm={handleDeleteGroup}
          confirmText="Delete Group"
        />
      </Suspense>

      <Suspense fallback={null}>
        <ConfirmDialog
          open={showDeleteExpenseConfirm}
          onOpenChange={setShowDeleteExpenseConfirm}
          title="Confirm Expense Deletion"
          description="Are you sure you want to delete this expense? This action cannot be undone."
          onConfirm={confirmDeleteExpense}
          confirmText="Delete Expense"
        />
      </Suspense>
    </div>
  );
}

