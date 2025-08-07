import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Doc } from "../../convex/_generated/dataModel";
import { ChevronDown } from "lucide-react";
import { getCurrencySymbol } from "@/lib/currencies";

interface ExpenseChartProps {
  expenses: (Doc<"expenses"> & { category?: Doc<"categories"> | null })[];
  group: Doc<"groups">;
  users: Doc<"users">[];
  categories: Doc<"categories">[];
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28DFF",
  "#FF6B6B",
  "#6BFFB8",
  "#FFD16B",
];

export const ExpenseChart: React.FC<ExpenseChartProps> = ({
  expenses,
  group,
  users,
  categories,
}) => {
  const { expenseShares, totalPaid, categorySpending } = React.useMemo(() => {
    const userShares: { [key: string]: number } = {};
    const userPaid: { [key: string]: number } = {};
    const categoryAmounts: { [key: string]: { name: string, color: string, amount: number } } = {};

    users.forEach((user) => {
      userShares[user.name] = 0;
      userPaid[user.name] = 0;
    });

    categories.forEach((category) => {
      categoryAmounts[category._id] = { name: category.name, color: category.color, amount: 0 };
    });

    expenses.forEach((expense) => {
      // Calculate shares
      const share = expense.amount / expense.splitAmong.length;
      expense.splitAmong.forEach((userId) => {
        const user = users.find((u) => u._id === userId);
        if (user) {
          userShares[user.name] += share;
        }
      });

      // Calculate total paid
      const payer = users.find((user) => user._id === expense.payerId);
      if (payer) {
        userPaid[payer.name] += expense.amount;
      }

      // Calculate category spending
      if (expense.categoryId) {
        if (categoryAmounts[expense.categoryId]) {
          categoryAmounts[expense.categoryId].amount += expense.amount;
        } else {
          // Handle case where category might not be in the initial list (e.g. deleted)
          const uncategorized = "Uncategorized";
          if (!categoryAmounts[uncategorized]) {
            categoryAmounts[uncategorized] = { name: uncategorized, color: "#808080", amount: 0 };
          }
          categoryAmounts[uncategorized].amount += expense.amount;
        }
      } else {
        const uncategorized = "Uncategorized";
        if (!categoryAmounts[uncategorized]) {
          categoryAmounts[uncategorized] = { name: uncategorized, color: "#808080", amount: 0 };
        }
        categoryAmounts[uncategorized].amount += expense.amount;
      }
    });

    const expenseSharesData = Object.keys(userShares)
      .map((name) => ({
        name,
        amount: userShares[name],
      }))
      .filter((user) => user.amount > 0);

    const totalPaidData = Object.keys(userPaid)
      .map((name) => ({
        name,
        amount: userPaid[name],
      }))
      .filter((user) => user.amount > 0);

    const categorySpendingData = Object.values(categoryAmounts).filter(c => c.amount > 0);

    return { expenseShares: expenseSharesData, totalPaid: totalPaidData, categorySpending: categorySpendingData };
  }, [expenses, users, categories]);

  const currencySymbol = getCurrencySymbol(group?.currency);

  return (
    <section className="space-y-4 border-t pt-6">
      <details className="group">
        <summary className="flex justify-between items-center cursor-pointer text-2xl font-bold text-primary">
          Expense Summary
          <ChevronDown className="h-6 w-6 transform transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4">
          {expenseShares.length === 0 ? (
            <p className="text-muted-foreground italic">
              No expenses to display.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-center">
                    Expense Shares
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseShares}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label={(entry) => `${entry.name}: ${currencySymbol}${entry.amount.toFixed(2)}`}
                      >
                        {expenseShares.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `${currencySymbol}${value.toFixed(2)}`,
                          "Share",
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-center">
                    Total Paid
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={totalPaid}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label={(entry) => `${entry.name}: ${currencySymbol}${entry.amount.toFixed(2)}`}
                      >
                        {totalPaid.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `${currencySymbol}${value.toFixed(2)}`,
                          "Paid",
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-center">
                    Category Spending
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categorySpending}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label={(entry) => `${entry.name}: ${currencySymbol}${entry.amount.toFixed(2)}`}
                      >
                        {categorySpending.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `${currencySymbol}${value.toFixed(2)}`,
                          "Spent",
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Expense Shares
                  </h3>
                  <ul className="space-y-2">
                    {expenseShares.map((entry, index) => (
                      <li key={index} className="flex items-center gap-x-2">
                        <span className="text-muted-foreground">
                          {entry.name}:
                        </span>
                        <span className="text-primary font-semibold">
                          {currencySymbol}
                          {entry.amount.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Total Paid
                  </h3>
                  <ul className="space-y-2">
                    {totalPaid.map((entry, index) => (
                      <li key={index} className="flex items-center gap-x-2">
                        <span className="text-muted-foreground">
                          {entry.name}:
                        </span>
                        <span className="text-primary font-semibold">
                          {currencySymbol}
                          {entry.amount.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Category Spending
                  </h3>
                  <ul className="space-y-2">
                    {categorySpending.map((entry, index) => (
                      <li key={index} className="flex items-center gap-x-2">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">
                          {entry.name}:
                        </span>
                        <span className="text-primary font-semibold">
                          {currencySymbol}
                          {entry.amount.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </details>
    </section>
  );
};
