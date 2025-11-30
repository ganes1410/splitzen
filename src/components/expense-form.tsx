import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import type { Id } from "../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";
import { CategoryCombobox } from "./category-combobox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ExpenseFormProps {
  groupId: Id<"groups">;
  initialData?: {
    _id?: Id<"expenses">;
    amount: number;
    description: string;
    payerId: Id<"users">;
    splitAmong: Id<"users">[];
    date?: string;
    categoryId?: Id<"categories">;
  };
  onSubmit: (data: {
    expenseId?: Id<"expenses">;
    amount: number;
    description: string;
    payerId: Id<"users">;
    splitAmong: Id<"users">[];
    date?: string;
    categoryId?: Id<"categories">;
  }) => void;
  submitButtonText: string;
  onCancel: () => void;
}

const expenseSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description cannot be empty"),
  payerId: z.string().min(1, "Please select a payer"),
  splitAmong: z
    .array(z.string())
    .min(1, "Please select at least one person to split with"),
  date: z.string().optional(),
  categoryId: z.string().optional(),
});

export function ExpenseForm({
  groupId,
  initialData,
  onSubmit,
  submitButtonText,
  onCancel,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState(initialData?.amount.toString() || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [payerId, setPayerId] = useState<string>(
    initialData?.payerId || ""
  );
  const [splitAmong, setSplitAmong] = useState<string[]>(
    initialData?.splitAmong || []
  );
  const [date, setDate] = useState<Date | undefined>(
    initialData?.date ? new Date(initialData.date) : new Date()
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<Id<"categories"> | null>(
    initialData?.categoryId || null
  );
  const [errors, setErrors] = useState<z.ZodIssue[] | null>(null);
  const users = useQuery(api.users.getUsersInGroup, { groupId });
  const categories = useQuery(api.categories.getCategoriesInGroup, { groupId });
  const createCategory = useMutation(api.categories.createCategory);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!initialData && users) {
      setSplitAmong(users.map((user) => user._id));
    }
  }, [users, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    const result = expenseSchema.safeParse({
      amount: parseFloat(amount),
      description,
      payerId,
      splitAmong,
      date: date?.toISOString().split("T")[0],
      categoryId: categoryId || undefined,
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
      categoryId: result.data.categoryId as Id<"categories"> | undefined,
    });
    toast.success("Expense saved successfully!");
  };

  if (users === undefined || categories === undefined) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (users === null || categories === null) {
    return <div className="p-6 text-center text-destructive">Error loading data.</div>;
  }

  const isFormValid =
    users && payerId && amount && description && splitAmong.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="amount"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Amount *
          </label>
          <Input
            ref={amountInputRef}
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="h-11"
          />
          {errors?.find((e: z.ZodIssue) => e.path[0] === "amount") && (
            <p className="text-destructive text-sm">
              {errors.find((e: z.ZodIssue) => e.path[0] === "amount")?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="date"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Date *
          </label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-11 justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  setDatePickerOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors?.find((e: z.ZodIssue) => e.path[0] === "date") && (
            <p className="text-destructive text-sm">
              {errors.find((e: z.ZodIssue) => e.path[0] === "date")?.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Description *
        </label>
        <Input
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Dinner at Italian restaurant"
          className="h-11"
        />
        {errors?.find((e: z.ZodIssue) => e.path[0] === "description") && (
          <p className="text-destructive text-sm">
            {
              errors.find((e: z.ZodIssue) => e.path[0] === "description")
                ?.message
            }
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="payer"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Paid By *
          </label>
          <Select value={payerId} onValueChange={setPayerId}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select Payer" />
            </SelectTrigger>
            <SelectContent>
              {users?.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.find((e: z.ZodIssue) => e.path[0] === "payerId") && (
            <p className="text-destructive text-sm">
              {errors.find((e: z.ZodIssue) => e.path[0] === "payerId")?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Category
          </label>
          <CategoryCombobox
            categories={categories}
            selectedCategoryId={categoryId}
            onSelectCategory={(id) => setCategoryId(id as Id<"categories"> | null)}
            onCreateCategory={async (categoryName) => {
              const newCategoryId = await createCategory({
                name: categoryName,
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                groupId,
              });
              return newCategoryId;
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Split Among *
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
          <p className="text-destructive text-sm">
            {
              errors.find((e: z.ZodIssue) => e.path[0] === "splitAmong")
                ?.message
            }
          </p>
        )}
      </div>

      {errors &&
        !errors.some((e: z.ZodIssue) =>
          ["amount", "description", "payerId", "splitAmong"].includes(
            e.path[0] as string
          )
        ) && (
          <p className="text-destructive text-sm">{errors[0].message}</p>
        )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={!isFormValid} className="flex-1 h-11">
          {submitButtonText}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-11"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
