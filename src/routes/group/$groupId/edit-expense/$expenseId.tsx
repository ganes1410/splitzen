import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ExpenseForm } from "@/components/expense-form";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/group/$groupId/edit-expense/$expenseId")(
  {
    component: EditExpense,
  }
);

function EditExpense() {
  const { groupId, expenseId } = Route.useParams();
  const router = useRouter();
  const updateExpense = useMutation(api.expenses.update);
  const expense = useQuery(api.expenses.get, { expenseId: expenseId as Id<"expenses"> });

  const handleSubmit = async (data: {
    amount: number;
    description: string;
    payerId: Id<"users">;
    splitAmong: Id<"users">[];
    date?: string;
  }) => {
    try {
      await updateExpense({
        expenseId: expenseId as Id<"expenses">,
        amount: data.amount,
        description: data.description,
        payerId: data.payerId,
        splitAmong: data.splitAmong,
        date: data.date,
      });
      router.navigate({ to: `/group/${groupId}` });
    } catch (error) {
      console.error("Error updating expense:", error);
      // Handle error in UI if needed
    }
  };

  if (expense === undefined) {
    return <div>Loading expense details...</div>;
  }

  if (expense === null) {
    return <div>Expense not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center text-primary">
        Edit Expense
      </h1>
      <ExpenseForm
        groupId={groupId as Id<"groups">}
        initialData={expense}
        onSubmit={handleSubmit}
        submitButtonText="Update Expense"
      />
    </div>
  );
}
