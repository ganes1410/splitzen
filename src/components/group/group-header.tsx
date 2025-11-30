import { useState, lazy, Suspense } from "react";
import { useRouter } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Check,
    Copy,
    MoreVertical,
    Plus,
    Settings,
    Trash2,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Expense } from "./expenses-section";

const ExpenseForm = lazy(() =>
    import("@/components/expense-form").then((m) => ({ default: m.ExpenseForm }))
);

interface GroupHeaderProps {
    group: Doc<"groups"> | null;
    groupId: string;
    setShowExpenseDialog: (show: boolean) => void;
    setCurrentExpense: (expense: Expense | undefined) => void;
    setShowDeleteGroupConfirm: (show: boolean) => void;
    showExpenseDialog: boolean;
    setShowExpenseDialogState: (show: boolean) => void;
    currentExpense: Expense | undefined;
}

export function GroupHeader({
    group,
    groupId,
    setShowExpenseDialog,
    setCurrentExpense,
    setShowDeleteGroupConfirm,
    showExpenseDialog,
    setShowExpenseDialogState,
    currentExpense,
}: GroupHeaderProps) {
    const [copied, setCopied] = useState(false);
    const createExpense = useMutation(api.expenses.create);
    const updateExpense = useMutation(api.expenses.update);
    const router = useRouter();
    const isMobile = useIsMobile();

    const handleCopy = () => {
        if (group?.inviteCode) {
            navigator.clipboard.writeText(group.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    return (
        <div className="space-y-4 mb-6">
            <div className="flex justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {group?.name}
                    </h1>
                    <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <span>Invite Code:</span>
                        <Badge variant="outline" className="ml-2 font-mono text-xs">
                            {group?.inviteCode}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className="ml-1 h-6 w-6"
                        >
                            {copied ? (
                                <Check className="h-3 w-3 text-green-500" />
                            ) : (
                                <Copy className="h-3 w-3" />
                            )}
                        </Button>
                    </div>
                </div>
                <div className="flex space-x-2">
                    {isMobile ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setCurrentExpense(undefined);
                                        setShowExpenseDialog(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Expense
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        router.navigate({
                                            to: "/$groupId/settings",
                                            params: { groupId },
                                        })
                                    }
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteGroupConfirm(true)}
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Group
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <Button
                                onClick={() => {
                                    setCurrentExpense(undefined);
                                    setShowExpenseDialog(true);
                                }}
                                className="shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                Add Expense
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() =>
                                            router.navigate({
                                                to: "/$groupId/settings",
                                                params: { groupId },
                                            })
                                        }
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteGroupConfirm(true)}
                                        className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                        Delete Group
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                    <Dialog
                        open={showExpenseDialog}
                        onOpenChange={setShowExpenseDialogState}
                    >
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {currentExpense ? "Edit Expense" : "Add Expense"}
                                </DialogTitle>
                            </DialogHeader>
                            <Suspense
                                fallback={
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-11 w-full" />
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-16" />
                                                <Skeleton className="h-11 w-full" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-11 w-full" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-11 w-full" />
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-11 w-full" />
                                            </div>
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
                                    }}
                                    submitButtonText={
                                        currentExpense ? "Update Expense" : "Add Expense"
                                    }
                                    onCancel={() => {
                                        setShowExpenseDialogState(false);
                                    }}
                                />
                            </Suspense>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
