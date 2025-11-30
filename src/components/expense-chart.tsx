import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Doc } from "../../convex/_generated/dataModel";
import { getCurrencySymbol } from "@/lib/currencies";
import { StatCard } from "./stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ChevronDown, ChevronUp, Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ExpenseChartProps {
  expenses: (Doc<"expenses"> & { category?: Doc<"categories"> | null })[];
  group: Doc<"groups">;
  users: Doc<"users">[];
  categories: Doc<"categories">[];
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({
  expenses,
  group,
  users,
  categories,
}) => {
  const currentUser = useQuery(api.users.getCurrentUser);
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    totalSpending,
    categorySpending,
    memberSpending,
  } = React.useMemo(() => {
    let totalSpending = 0;
    const userShares: { [key: string]: number } = {};
    const userPaid: { [key: string]: number } = {};
    const categoryAmounts: { [key: string]: { name: string; color: string; amount: number } } = {};

    users.forEach((user) => {
      userShares[user._id] = 0;
      userPaid[user._id] = 0;
    });

    categories.forEach((category) => {
      categoryAmounts[category._id] = { name: category.name, color: category.color, amount: 0 };
    });

    expenses.forEach((expense) => {
      totalSpending += expense.amount;
      const share = expense.amount / expense.splitAmong.length;
      expense.splitAmong.forEach((userId) => {
        userShares[userId] += share;
      });

      userPaid[expense.payerId] += expense.amount;

      const categoryId = expense.categoryId || "uncategorized";
      if (!categoryAmounts[categoryId]) {
        const category = categories.find(c => c._id === categoryId);
        categoryAmounts[categoryId] = {
          name: category?.name || "Uncategorized",
          color: category?.color || "#808080",
          amount: 0
        };
      }
      categoryAmounts[categoryId].amount += expense.amount;
    });

    const categorySpendingData = Object.values(categoryAmounts)
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const memberSpendingData = users.map(user => ({
      name: user.name,
      paid: userPaid[user._id],
      share: userShares[user._id],
      balance: userPaid[user._id] - userShares[user._id],
    }));

    return {
      totalSpending,
      categorySpending: categorySpendingData,
      memberSpending: memberSpendingData,
    };
  }, [expenses, users, categories, currentUser]);

  const currencySymbol = getCurrencySymbol(group?.currency);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Expense Summary
            </CardTitle>
            <CardDescription>Overview of group spending</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-1">
            <StatCard
              title="Total Group Spending"
              value={`${currencySymbol}${totalSpending.toFixed(2)}`}
              icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories">By Category</TabsTrigger>
              <TabsTrigger value="members">By Member</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="mt-4">
              {categorySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categorySpending} layout="vertical" margin={{ right: 80 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${currencySymbol}${value.toFixed(2)}`,
                        "Spent",
                      ]}
                      cursor={{ fill: "transparent" }}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="amount"
                        position="right"
                        formatter={(value: any) => `${currencySymbol}${value.toFixed(2)}`}
                        className="fill-foreground text-sm font-medium"
                      />
                      {categorySpending.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No category data available
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberSpending.map((member) => (
                      <TableRow key={member.name}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-right">{`${currencySymbol}${member.paid.toFixed(2)}`}</TableCell>
                        <TableCell className="text-right">{`${currencySymbol}${member.share.toFixed(2)}`}</TableCell>
                        <TableCell className={`text-right font-semibold ${member.balance > 0 ? 'text-green-600 dark:text-green-400' : member.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                          {member.balance > 0 ? '+' : ''}{`${currencySymbol}${member.balance.toFixed(2)}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
};
