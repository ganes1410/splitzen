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
  expenses: Doc<"expenses">[];
  group: Doc<"groups">;
  users: Doc<"users">[];
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
}) => {
  const { expenseShares, totalPaid } = React.useMemo(() => {
    const userShares: { [key: string]: number } = {};
    const userPaid: { [key: string]: number } = {};

    users.forEach((user) => {
      userShares[user.name] = 0;
      userPaid[user.name] = 0;
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

    return { expenseShares: expenseSharesData, totalPaid: totalPaidData };
  }, [expenses, users]);

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
                    label
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
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </>
          )}
        </div>
      </details>
    </section>
  );
};
