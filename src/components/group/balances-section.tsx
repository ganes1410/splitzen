import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";
import { getCurrencySymbol } from "@/lib/currencies";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

interface BalancesSectionProps {
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
}

export function BalancesSection({
    balances,
    users,
    setShowSettleForm,
    setPrefillSettleForm,
}: BalancesSectionProps) {
    const getUserName = (userId: string) => {
        return users?.find((user) => user._id === userId)?.name || "Unknown";
    };

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-xl">Balances</CardTitle>
                <CardDescription>Who owes who</CardDescription>
            </CardHeader>
            <CardContent>
                {balances?.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>All settled up! No outstanding balances.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {balances?.map((balance, index) => (
                            <div
                                key={index}
                                className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm">
                                            {getUserName(balance.from).charAt(0).toUpperCase()}
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
                                            {getUserName(balance.to).charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">
                                            {getCurrencySymbol(balance.currency)}
                                            {balance.amount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-sm text-muted-foreground mb-3">
                                    <span className="font-medium text-foreground">
                                        {getUserName(balance.from)}
                                    </span>{" "}
                                    owes{" "}
                                    <span className="font-medium text-foreground">
                                        {getUserName(balance.to)}
                                    </span>
                                </div>

                                <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                        setPrefillSettleForm({
                                            from: balance.from as Id<"users">,
                                            to: balance.to as Id<"users">,
                                            amount: balance.amount,
                                        });
                                        setShowSettleForm(true);
                                    }}
                                >
                                    Settle Up
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
