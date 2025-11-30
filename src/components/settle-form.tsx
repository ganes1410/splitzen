import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface SettleFormProps {
  users: { _id: Id<"users">; name: string }[];
  onSubmit: (data: {
    from: Id<"users">;
    to: Id<"users">;
    amount: number;
    note?: string;
  }) => void;
  onCancel: () => void;
  initialData?: {
    from: Id<"users">;
    to: Id<"users">;
    amount: number;
  };
}

export function SettleForm({
  users,
  onSubmit,
  onCancel,
  initialData,
}: SettleFormProps) {
  const [settleFrom, setSettleFrom] = useState(initialData?.from || "");
  const [settleTo, setSettleTo] = useState(initialData?.to || "");
  const [settleAmount, setSettleAmount] = useState(
    initialData?.amount.toFixed(2) || ""
  );
  const [settleNote, setSettleNote] = useState("");

  useEffect(() => {
    if (initialData) {
      setSettleFrom(initialData.from);
      setSettleTo(initialData.to);
      setSettleAmount(initialData.amount.toFixed(2));
    } else {
      setSettleFrom("");
      setSettleTo("");
      setSettleAmount("");
    }
    setSettleNote("");
  }, [initialData]);

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      from: settleFrom as Id<"users">,
      to: settleTo as Id<"users">,
      amount: parseFloat(settleAmount),
      note: settleNote || undefined,
    });
    toast.success("Settlement recorded successfully!");
  };

  return (
    <form onSubmit={handleSettle} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="settle-from"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          From
        </label>
        <Select value={settleFrom} onValueChange={setSettleFrom}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select User" />
          </SelectTrigger>
          <SelectContent>
            {users?.map((user) => (
              <SelectItem key={user._id} value={user._id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="settle-to"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          To
        </label>
        <Select value={settleTo} onValueChange={setSettleTo}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select User" />
          </SelectTrigger>
          <SelectContent>
            {users?.map((user) => (
              <SelectItem key={user._id} value={user._id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="settle-amount"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Amount
        </label>
        <Input
          id="settle-amount"
          name="settle-amount"
          type="number"
          step="0.01"
          value={settleAmount}
          onChange={(e) => setSettleAmount(e.target.value)}
          placeholder="Enter amount"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="settle-note"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Note (Optional)
        </label>
        <Input
          id="settle-note"
          name="settle-note"
          value={settleNote}
          onChange={(e) => setSettleNote(e.target.value)}
          placeholder="Add a note"
          className="h-11"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1 h-11">
          Record Settlement
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
