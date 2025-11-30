import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Filter,
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { getCurrencySymbol } from "@/lib/currencies";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

export type Expense = Doc<"expenses"> & { category?: Doc<"categories"> | null };

interface ExpensesSectionProps {
    expenses: Expense[] | undefined;
    group: Doc<"groups"> | null;
    users: Doc<"users">[] | undefined;
    categories: Doc<"categories">[] | undefined;
    handleDeleteExpense: (expenseId: Id<"expenses">) => void;
    setCurrentExpense: (expense: Expense) => void;
    setShowExpenseDialog: (show: boolean) => void;
    sortBy: string;
    filterBy: string;
    setSortBy: (sortBy: string) => void;
    setFilterBy: (filterBy: string) => void;
}

export function ExpensesSection({
    expenses,
    group,
    users,
    categories,
    handleDeleteExpense,
    setCurrentExpense,
    setShowExpenseDialog,
    sortBy,
    filterBy,
    setSortBy,
    setFilterBy,
}: ExpensesSectionProps) {
    const [expandedExpenseIds, setExpandedExpenseIds] = useState<
        Id<"expenses">[]
    >([]);

    const getUserName = (userId: string) => {
        return users?.find((user) => user._id === userId)?.name || "Unknown";
    };

    const getCategory = (categoryId: Id<"categories">) => {
        return categories?.find((category) => category._id === categoryId);
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
            if (sortBy === "dateDesc") {
                const dateA = new Date(a.date as string).getTime();
                const dateB = new Date(b.date as string).getTime();
                if (dateB !== dateA) return dateB - dateA;
                return b._creationTime - a._creationTime;
            } else if (sortBy === "dateAsc") {
                const dateA = new Date(a.date as string).getTime();
                const dateB = new Date(b.date as string).getTime();
                if (dateA !== dateB) return dateA - dateB;
                return a._creationTime - b._creationTime;
            } else if (sortBy === "amount") {
                return b.amount - a.amount;
            }
            return 0;
        });
    }, [expenses, sortBy, filterBy]);

    const groupedExpenses = useMemo(() => {
        if (!sortedAndFilteredExpenses) return {};
        return sortedAndFilteredExpenses.reduce((acc, expense) => {
            const date = new Date(expense.date || "").toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(expense);
            return acc;
        }, {} as Record<string, Expense[]>);
    }, [sortedAndFilteredExpenses]);

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-xl">Expenses</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Filter expenses..."
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value)}
                                className="pl-9 w-full md:w-[200px] h-9"
                            />
                        </div>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-9 w-full md:w-[180px]">
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dateDesc">Newest First</SelectItem>
                                <SelectItem value="dateAsc">Oldest First</SelectItem>
                                <SelectItem value="amount">Highest Amount</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {Object.keys(groupedExpenses).length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>No expenses found.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedExpenses)
                            .sort(([dateA], [dateB]) => {
                                if (sortBy === "dateDesc") {
                                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                                } else if (sortBy === "dateAsc") {
                                    return new Date(dateA).getTime() - new Date(dateB).getTime();
                                }
                                return 0;
                            })
                            .map(([date, expensesOnDate]) => (
                                <div key={date}>
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pl-1">
                                        {date}
                                    </h3>
                                    <div className="space-y-3">
                                        {expensesOnDate.map((expense) => {
                                            const category = expense.categoryId
                                                ? getCategory(expense.categoryId)
                                                : null;
                                            const isExpanded = expandedExpenseIds.includes(expense._id);

                                            return (
                                                <div
                                                    key={expense._id}
                                                    className="group border rounded-lg bg-card transition-all hover:shadow-md"
                                                >
                                                    <div
                                                        className="p-4 flex items-center justify-between cursor-pointer"
                                                        onClick={() =>
                                                            setExpandedExpenseIds((prev) =>
                                                                prev.includes(expense._id)
                                                                    ? prev.filter((id) => id !== expense._id)
                                                                    : [...prev, expense._id]
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className={`p-2 rounded-full bg-primary/10 text-primary shrink-0`}>
                                                                {category ? (
                                                                    <div
                                                                        className="w-5 h-5 rounded-full"
                                                                        style={{ backgroundColor: category.color }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-5 h-5 rounded-full bg-muted" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium truncate text-foreground">
                                                                        {expense.description}
                                                                    </p>
                                                                    {expense.category && (
                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium truncate max-w-[120px]">
                                                                            {expense.category.name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground truncate">
                                                                    <span className="font-medium text-foreground">
                                                                        {getUserName(expense.payerId)}
                                                                    </span>{" "}
                                                                    paid{" "}
                                                                    <span className="font-medium text-primary">
                                                                        {getCurrencySymbol(group?.currency)}
                                                                        {expense.amount.toFixed(2)}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="px-4 pb-4 pt-0">
                                                            <Separator className="my-3" />
                                                            <div className="space-y-3">
                                                                <div className="grid gap-2">
                                                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Split Details</h4>
                                                                    <div className="grid gap-1">
                                                                        {expense.splitAmong.map((userId) => {
                                                                            const user = users?.find((u) => u._id === userId);
                                                                            const share =
                                                                                expense.amount / expense.splitAmong.length;
                                                                            return (
                                                                                <div
                                                                                    key={userId}
                                                                                    className="flex items-center justify-between text-sm"
                                                                                >
                                                                                    <span className="text-muted-foreground">{user?.name || "Unknown"}</span>
                                                                                    <span className="font-medium">
                                                                                        {getCurrencySymbol(group?.currency)}
                                                                                        {share.toFixed(2)}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                <div className="flex justify-end gap-2 mt-4">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setCurrentExpense(expense);
                                                                            setShowExpenseDialog(true);
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteExpense(expense._id as Id<"expenses">);
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
