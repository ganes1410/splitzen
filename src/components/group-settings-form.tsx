import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import type { Id } from "../../convex/_generated/dataModel";
import { currencies } from "@/lib/currencies";
import { MultiSelect } from "@/components/ui/multi-select";
import { Combobox } from "@/components/ui/combobox";

interface GroupSettingsFormProps {
  group: {
    _id: Id<"groups">;
    name: string;
    currency?: string;
  };
  allParticipants: {
    _id: Id<"users">;
    name: string;
  }[];
  initialSelectedParticipants: Id<"users">[];
  onSubmit: (data: {
    name: string;
    currency: string;
    selectedParticipantIds: Id<"users">[];
  }) => void;
  onCancel: () => void;
  addUserToGroup: (name: string, groupId: Id<"groups">) => Promise<any>;
}

const groupSettingsSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  currency: z.string().min(1, "Please select a currency"),
});

export function GroupSettingsForm({
  group,
  allParticipants,
  initialSelectedParticipants,
  onSubmit,
  onCancel,
  addUserToGroup,
}: GroupSettingsFormProps) {
  const [name, setName] = useState(group.name);
  const [currency, setCurrency] = useState(group.currency || "USD");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >(initialSelectedParticipants);
  const [errors, setErrors] = useState<z.ZodIssue[] | null>(null);
  const [newParticipantName, setNewParticipantName] = useState("");

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
      selectedParticipantIds: selectedParticipantIds as Id<"users">[],
    });
  };

  const handleAddParticipant = async () => {
    if (newParticipantName.trim() !== "") {
      await addUserToGroup(newParticipantName, group._id);
      setNewParticipantName("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:w-1/2">
      <div>
        <label
          htmlFor="group-name"
          className="block text-sm font-medium text-foreground mb-1"
        >
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
        <label
          htmlFor="currency"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Currency
        </label>
        <Combobox
          options={currencies.map((c) => ({
            value: c.code,
            label: `${c.code} (${c.symbol})`,
          }))}
          value={currency}
          onChange={setCurrency}
          placeholder="Select Currency"
        />
        {errors?.find((e) => e.path[0] === "currency") && (
          <p className="text-destructive text-sm mt-1">
            {errors.find((e) => e.path[0] === "currency")?.message}
          </p>
        )}
      </div>
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Participants
        </h3>
        <MultiSelect
          options={allParticipants.map((p) => ({
            value: p._id,
            label: p.name,
          }))}
          selected={selectedParticipantIds}
          onChange={setSelectedParticipantIds}
        />
      </div>
      <div className="flex items-end space-x-2">
        <div className="flex-grow">
          <label
            htmlFor="new-participant"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Add New Participant
          </label>
          <Input
            id="new-participant"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            placeholder="Participant name"
          />
        </div>
        <Button type="button" onClick={handleAddParticipant}>
          Add
        </Button>
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
