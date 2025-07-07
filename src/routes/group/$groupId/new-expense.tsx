import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { ExpenseForm } from "@/components/expense-form";

export const Route = createFileRoute("/group/$groupId/new-expense")({
  component: NewExpense,
  staticData: ({ loaderData }: { loaderData: { groupId: string } }) => ({
    title: `Splitzen - Add Expense to ${loaderData.groupId}`,
  }),
});

function NewExpense() {
  const { groupId } = Route.useParams();
  const router = useRouter();
  const createExpense = useMutation(api.expenses.create);

  const handleSubmit = async (data: {
    amount: number;
    description: string;
    payerId: Id<"users">;
    splitAmong: Id<"users">[];
  }) => {
    try {
      await createExpense({
        groupId: groupId as Id<"groups">,
        ...data,
      });
      router.navigate({ to: `/group/${groupId}` });
    } catch (error) {
      console.error("Error creating expense:", error);
      // Handle error in UI if needed
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center text-primary">
        Add Expense to Group
      </h1>
      <ExpenseForm
        groupId={groupId as Id<"groups">}
        onSubmit={handleSubmit}
        submitButtonText="Add Expense"
      />
    </div>
  );
}
