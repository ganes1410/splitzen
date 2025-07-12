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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B', '#6BFFB8', '#FFD16B'];

export const ExpenseChart: React.FC<ExpenseChartProps> = ({
  expenses,
  group,
  users,
}) => {
  const data = React.useMemo(() => {
    const userExpenses: { [key: string]: number } = {};

    expenses.forEach((expense) => {
      const payer = users.find((user) => user._id === expense.payerId);
      if (payer) {
        userExpenses[payer.name] =
          (userExpenses[payer.name] || 0) + expense.amount;
      }
    });

    return Object.keys(userExpenses).map((name) => ({
      name,
      amount: userExpenses[name],
    }));
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
          {data.length === 0 ? (
            <p className="text-muted-foreground italic">No expenses to display.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `${currencySymbol}${value.toFixed(2)}`,
                      "Amount",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">Detailed Expenses</h3>
                <ul className="space-y-2">
                  {data.map((entry, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="font-medium">{entry.name}:</span>
                      <span className="text-primary font-semibold">
                        {currencySymbol}{entry.amount.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </details>
    </section>
  );
};
