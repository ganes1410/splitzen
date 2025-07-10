import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import type { Id } from "../../convex/_generated/dataModel";
import { currencies } from "@/lib/currencies";

interface GroupSettingsFormProps {
  group: {
    _id: Id<"groups">;
    name: string;
    currency?: string;
  };
  participants: {
    _id: Id<"users">;
    name: string;
  }[];
  onSubmit: (data: {
    name: string;
    currency: string;
    participants: { _id: Id<"users">; name: string }[];
  }) => void;
  onCancel: () => void;
}

const groupSettingsSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  currency: z.string().min(1, "Please select a currency"),
});

export function GroupSettingsForm({
  group,
  participants,
  onSubmit,
  onCancel,
}: GroupSettingsFormProps) {
  const [name, setName] = useState(group.name);
  const [currency, setCurrency] = useState(group.currency || "USD");
  const [editedParticipants, setEditedParticipants] = useState(participants);
  const [errors, setErrors] = useState<z.ZodIssue[] | null>(null);

  const handleParticipantNameChange = (userId: Id<"users">, newName: string) => {
    setEditedParticipants((prev) =>
      prev.map((p) => (p._id === userId ? { ...p, name: newName } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    const result = groupSettingsSchema.safeParse({ name, currency });

    if (!result.success) {
      setErrors(result.error.issues);
      return;
    }

    onSubmit({
      name: result.data.name,
      currency: result.data.currency,
      participants: editedParticipants,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="group-name" className="block text-sm font-medium text-foreground mb-1">
          Group Name
        </label>
        <Input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors?.find((e) => e.path[0] === "name") && (
          <p className="text-destructive text-sm mt-1">
            {errors.find((e) => e.path[0] === "name")?.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-foreground mb-1">
          Currency
        </label>
        <Input
          id="currency"
          list="currency-list"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        />
        <datalist id="currency-list">
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </datalist>
        {errors?.find((e) => e.path[0] === "currency") && (
          <p className="text-destructive text-sm mt-1">
            {errors.find((e) => e.path[0] === "currency")?.message}
          </p>
        )}
      </div>
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Participants</h3>
        <ul className="space-y-2">
          {editedParticipants.map((participant) => (
            <li key={participant._id} className="flex items-center gap-2">
              <Input
                value={participant.name}
                onChange={(e) => handleParticipantNameChange(participant._id, e.target.value)}
                className="flex-grow"
              />
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
