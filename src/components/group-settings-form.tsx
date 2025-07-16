import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import type { Id } from "../../convex/_generated/dataModel";
import { currencies } from "@/lib/currencies";
import { createMultiSelect } from "@/components/ui/multi-select";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useConvex } from "convex/react";
import { api } from "convex/_generated/api";
import { ConvexError } from "convex/values";

interface GroupSettingsFormProps {
  group: {
    _id: Id<"groups">;
    name: string;
    currency?: string;
  };
  allParticipants: {
    _id: Id<"users">;
    _creationTime: number;
    userId?: string | undefined;
    groupId?: string | undefined;
    sessionId?: string | undefined;
    name: string;
  }[];
  initialSelectedParticipants: Id<"users">[];
  onSubmit: (data: {
    name: string;
    currency: string;
    selectedParticipantIds: Id<"users">[];
  }) => void;
  onCancel: () => void;
  addUserToGroup: (
    name: string,
    groupId: Id<"groups">
  ) => Promise<{
    userId: string;
    userRecordId: Id<"users">;
  }>;
  removeUserFromGroup: (
    userId: Id<"users">,
    groupId: Id<"groups">
  ) => Promise<any>;
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
  removeUserFromGroup,
}: GroupSettingsFormProps) {
  const [name, setName] = useState(group.name);
  const [currency, setCurrency] = useState(group.currency || "USD");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    Array<Id<"users">>
  >(initialSelectedParticipants);
  const [errors, setErrors] = useState<z.ZodIssue[] | null>(null);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [showRemoveParticipantConfirm, setShowRemoveParticipantConfirm] =
    useState(false);
  const [participantToRemove, setParticipantToRemove] =
    useState<Id<"users"> | null>(null);
  const convex = useConvex();
  const UserMultiSelect = createMultiSelect<Id<"users">>();

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
    toast.success("Group settings updated!");
  };

  const handleAddParticipant = async () => {
    if (newParticipantName.trim() === "") return;
    try {
      const { userRecordId } = await addUserToGroup(
        newParticipantName,
        group._id
      );
      setSelectedParticipantIds((prev) => [...prev, userRecordId]);
      setNewParticipantName("");
      toast.success("Participant added successfully!");
    } catch (error) {
      console.error("Failed to add participant:", error);
      toast.error("Failed to add participant. Please try again.");
    }
  };

  const handleRemoveParticipant = async (userIdToRemove: Id<"users">) => {
    const user = await convex.query(api.users.getUserByRecordId, {
      userRecordId: userIdToRemove,
    });

    if (user.userId === localStorage.getItem("userId")) {
      toast.error("You cannot remove yourself from the group.");
      return;
    }
    setParticipantToRemove(userIdToRemove as Id<"users">);
    setShowRemoveParticipantConfirm(true);
  };

  const confirmRemoveParticipant = async () => {
    if (!participantToRemove) return;
    try {
      await removeUserFromGroup(participantToRemove, group._id);
      toast.success("Participant removed successfully!");
      setSelectedParticipantIds(
        selectedParticipantIds.filter((id) => id !== participantToRemove)
      );
      setParticipantToRemove(null);
      setShowRemoveParticipantConfirm(false);
    } catch (error) {
      console.log({ error });
      toast.error(
        error instanceof ConvexError
          ? error?.data
          : "Failed to remove participant. Please try again."
      );
      setShowRemoveParticipantConfirm(false);
      setParticipantToRemove(null);
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
        <UserMultiSelect
          options={allParticipants.map((p) => ({
            value: p._id,
            label: p.name,
          }))}
          selected={selectedParticipantIds}
          onChange={setSelectedParticipantIds}
          onRemove={handleRemoveParticipant}
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

      <ConfirmDialog
        open={showRemoveParticipantConfirm}
        onOpenChange={setShowRemoveParticipantConfirm}
        title="Remove Participant"
        description="Are you sure you want to remove this participant from the group? This will not delete their past expenses, but they will no longer be able to add new ones."
        onConfirm={confirmRemoveParticipant}
        confirmText="Remove"
      />
    </form>
  );
}
