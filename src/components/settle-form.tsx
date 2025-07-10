import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Id } from "../../convex/_generated/dataModel";

interface SettleFormProps {
  users: { _id: Id<"users">; name: string }[];
  onSubmit: (data: {
    from: Id<"users">;
    to: Id<"users">;
    amount: number;
    note?: string;
  }) => void;
  onCancel: () => void;
}

export function SettleForm({ users, onSubmit, onCancel }: SettleFormProps) {
  const [settleFrom, setSettleFrom] = useState("");
  const [settleTo, setSettleTo] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      from: settleFrom as Id<"users">,
      to: settleTo as Id<"users">,
      amount: parseFloat(settleAmount),
      note: settleNote || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSettle}
      className="space-y-4 p-2 rounded-lg shadow-md"
    >
      <div>
        <label
          htmlFor="settle-from"
          className="block text-sm font-medium text-foreground mb-1"
        >
          From
        </label>
        <select
          id="settle-from"
          name="settle-from"
          value={settleFrom}
          onChange={(e) => setSettleFrom(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select User</option>
          {users?.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="settle-to"
          className="block text-sm font-medium text-foreground mb-1"
        >
          To
        </label>
        <select
          id="settle-to"
          name="settle-to"
          value={settleTo}
          onChange={(e) => setSettleTo(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select User</option>
          {users?.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="settle-amount"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Amount
        </label>
        <Input
          id="settle-amount"
          name="settle-amount"
          type="number"
          value={settleAmount}
          onChange={(e) => setSettleAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full"
        />
      </div>

      <div>
        <label
          htmlFor="settle-note"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Note (Optional)
        </label>
        <Input
          id="settle-note"
          name="settle-note"
          value={settleNote}
          onChange={(e) => setSettleNote(e.target.value)}
          placeholder="Add a note"
          className="w-full"
        />
      </div>

      <div className="flex gap-2 flex-col gap-y-4 mt-6">
        <Button type="submit" className="w-full">
          Record Settlement
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
