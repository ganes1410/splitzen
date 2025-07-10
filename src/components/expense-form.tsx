import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import type { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MultiSelect } from "@/components/ui/multi-select";
import { useRouter } from "@tanstack/react-router";

interface ExpenseFormProps {
  groupId: Id<"groups">;
  initialData?: {
    _id?: Id<"expenses">;
    amount: number;
    description: string;
    payerId: Id<"users">;
    splitAmong: Id<"users">[];
    date?: string;
  };
  onSubmit: (data: {
    expenseId?: Id<"expenses">;
    amount: number;
    description: string;
    payerId: Id<"users">;
    splitAmong: Id<"users">[];
    date?: string;
  }) => void;
  submitButtonText: string;
}

const expenseSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description cannot be empty"),
  payerId: z.string().min(1, "Please select a payer"),
  splitAmong: z
    .array(z.string())
    .min(1, "Please select at least one person to split with"),
  date: z.string().optional(),
});

export function ExpenseForm({
  groupId,
  initialData,
  onSubmit,
  submitButtonText,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState(initialData?.amount.toString() || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [payerId, setPayerId] = useState<Id<"users"> | "">(
    initialData?.payerId || ""
  );
  const [splitAmong, setSplitAmong] = useState<string[]>(
    initialData?.splitAmong || []
  );
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<z.ZodIssue[] | null>(null);

  const router = useRouter();
  const users = useQuery(api.users.getUsersInGroup, { groupId });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    const result = expenseSchema.safeParse({
      amount: parseFloat(amount),
      description,
      payerId,
      splitAmong,
      date,
    });

    if (!result.success) {
      setErrors(result.error.issues);
      return;
    }

    onSubmit({
      expenseId: initialData?._id,
      amount: result.data.amount,
      description: result.data.description,
      payerId: result.data.payerId as Id<"users">,
      splitAmong: result.data.splitAmong as Id<"users">[],
      date: result.data.date,
    });
  };

  if (users === undefined) {
    return <div>Loading users...</div>;
  }

  if (users === null) {
    return <div>Error loading users.</div>;
  }

  const isFormValid =
    users && payerId && amount && description && splitAmong.length > 0;

  return (
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
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 25.50"
          className="w-full"
        />
        {errors?.find((e: z.ZodIssue) => e.path[0] === "amount") && (
          <p className="text-destructive text-sm mt-1">
            {errors.find((e: z.ZodIssue) => e.path[0] === "amount")?.message}
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
        {errors?.find((e: z.ZodIssue) => e.path[0] === "description") && (
          <p className="text-destructive text-sm mt-1">
            {errors.find((e: z.ZodIssue) => e.path[0] === "description")?.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="date"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Date
        </label>
        <Input
          id="date"
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full"
        />
        {errors?.find((e: z.ZodIssue) => e.path[0] === "date") && (
          <p className="text-destructive text-sm mt-1">
            {errors.find((e: z.ZodIssue) => e.path[0] === "date")?.message}
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
          onChange={(e) => setPayerId(e.target.value as Id<"users">)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select Payer</option>
          {users?.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
        {errors?.find((e: z.ZodIssue) => e.path[0] === "payerId") && (
          <p className="text-destructive text-sm mt-1">
            {errors.find((e: z.ZodIssue) => e.path[0] === "payerId")?.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Split Among
        </label>
        <MultiSelect
          options={users.map((user) => ({
            value: user._id,
            label: user.name,
          }))}
          selected={splitAmong}
          onChange={setSplitAmong}
        />
        {errors?.find((e: z.ZodIssue) => e.path[0] === "splitAmong") && (
          <p className="text-destructive text-sm mt-1">
            {errors.find((e: z.ZodIssue) => e.path[0] === "splitAmong")?.message}
          </p>
        )}
      </div>

      {errors &&
        !errors.some((e: z.ZodIssue) =>
          ["amount", "description", "payerId", "splitAmong"].includes(
            e.path[0] as string
          )
        ) && (
          <p className="text-destructive text-sm mt-1">{errors[0].message}</p>
        )}

      <div className="flex gap-2 flex-col">
        <Button type="submit" disabled={!isFormValid} className="w-full">
          {submitButtonText}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.history.back()}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
