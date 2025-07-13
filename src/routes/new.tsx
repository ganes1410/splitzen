import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { currencies } from "@/lib/currencies";
import { Combobox } from "@/components/ui/combobox";

export const Route = createFileRoute("/new")({
  component: CreateGroup,
});

const createGroupSchema = z.object({
  groupName: z.string().min(3, "Group name must be at least 3 characters"),
  userName: z.string().min(2, "Your name must be at least 2 characters"),
  currency: z.string().min(1, "Please select a currency"),
});

const createGroupWithUserSchema = z.object({
  groupName: z.string().min(3, "Group name must be at least 3 characters"),
  currency: z.string().min(1, "Please select a currency"),
});

function CreateGroup() {
  const createGroup = useMutation(api.groups.create);
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [userName, setUserName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [errors, setErrors] = useState<z.ZodIssue[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (userName.length === 0 && localStorage.getItem("userId")) {
    setUserName(localStorage.getItem("userId") || "");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    setLoading(true);

    const trimmedGroupName = groupName.trim();
    const trimmedUserName = userName.trim();

    const isUserPresent = Boolean(localStorage.getItem("userId"));

    const result = isUserPresent
      ? createGroupWithUserSchema.safeParse({
          groupName: trimmedGroupName,
          currency,
        })
      : createGroupSchema.safeParse({
          groupName: trimmedGroupName,
          userName: trimmedUserName,
          currency,
        });

    if (!result.success) {
      setErrors(result.error.issues);
      setLoading(false);
      return;
    }

    try {
      let userId = localStorage.getItem("userId") || undefined;
      const { groupId, userId: newUserId } = await createGroup({
        groupName: trimmedGroupName,
        currency: result.data.currency,
        userId,
        userName: isUserPresent
          ? (localStorage.getItem("userId") ?? "")
          : trimmedUserName,
      });
      if (!userId) {
        localStorage.setItem("userId", newUserId);
      }
      router.navigate({ to: `/group/${groupId}` });
    } catch (error) {
      console.error("Error creating group:", error);
      setErrors([
        { message: "Failed to create group. Please try again." } as z.ZodIssue,
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center text-primary">
        Create a New Group
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md mx-auto p-6 bg-card rounded-lg shadow-md"
      >
        <div>
          <label
            htmlFor="group-name"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Group Name
          </label>
          <Input
            id="group-name"
            name="group-name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g., Japan Trip 2025"
            className="w-full"
            disabled={loading}
          />
          {errors?.find((e) => e.path[0] === "groupName") && (
            <p className="text-destructive text-sm mt-1">
              {errors.find((e) => e.path[0] === "groupName")?.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="user-name"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Your Name
          </label>
          <Input
            id="user-name"
            name="user-name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g., Alice"
            className="w-full"
            disabled={
              loading ||
              (typeof window !== "undefined" &&
                localStorage.getItem("userId") !== null)
            }
          />
          {errors?.find((e) => e.path[0] === "userName") && (
            <p className="text-destructive text-sm mt-1">
              {errors.find((e) => e.path[0] === "userName")?.message}
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
        {errors &&
          !errors.some((e) =>
            ["groupName", "userName"].includes(e.path[0] as string)
          ) && (
            <p className="text-destructive text-sm mt-1">{errors[0].message}</p>
          )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Group"}
        </Button>
      </form>
    </div>
  );
}
