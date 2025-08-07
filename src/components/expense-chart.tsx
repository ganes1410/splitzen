import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Doc } from "../../convex/_generated/dataModel";
import { getCurrencySymbol } from "@/lib/currencies";
import { StatCard } from "./stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TrendingUp, Users, Wallet } from "lucide-react";

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

  const {
    totalSpending,
    yourShare,
    netBalance,
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

    const yourShare = currentUser ? userShares[currentUser._id] : 0;
    const yourPaid = currentUser ? userPaid[currentUser._id] : 0;
    const netBalance = yourPaid - yourShare;

    const categorySpendingData = Object.values(categoryAmounts).filter(c => c.amount > 0);

    const memberSpendingData = users.map(user => ({
      name: user.name,
      paid: userPaid[user._id],
      share: userShares[user._id],
      balance: userPaid[user._id] - userShares[user._id],
    }));

    return {
      totalSpending,
      yourShare,
      netBalance,
      categorySpending: categorySpendingData,
      memberSpending: memberSpendingData,
    };
  }, [expenses, users, categories, currentUser]);

  const currencySymbol = getCurrencySymbol(group?.currency);

  return (
    <section className="space-y-4 border-t pt-6">
      <h2 className="text-2xl font-bold text-primary mb-4">Expense Summary</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Group Spending"
          value={`${currencySymbol}${totalSpending.toFixed(2)}`}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Your Personal Share"
          value={`${currencySymbol}${yourShare.toFixed(2)}`}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Your Net Balance"
          value={`${currencySymbol}${netBalance.toFixed(2)}`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      <Tabs defaultValue="categories" className="mt-4">
        <TabsList>
          <TabsTrigger value="categories">Category Spending</TabsTrigger>
          <TabsTrigger value="members">Member Spending</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categorySpending} layout="vertical">
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
                {categorySpending.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="members">
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
                  <TableCell>{member.name}</TableCell>
                  <TableCell className="text-right">{`${currencySymbol}${member.paid.toFixed(2)}`}</TableCell>
                  <TableCell className="text-right">{`${currencySymbol}${member.share.toFixed(2)}`}</TableCell>
                  <TableCell className={`text-right font-semibold ${member.balance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {`${currencySymbol}${member.balance.toFixed(2)}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </section>
  );
};
