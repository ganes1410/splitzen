import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";

export const Route = createFileRoute("/join/$inviteCode")({
  component: JoinGroup,
});

const joinGroupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

function JoinGroup() {
  const { inviteCode } = Route.useParams();
  const joinGroup = useMutation(api.users.join);
  const router = useRouter();
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<z.ZodIssue[] | null>(null);

  const group = useQuery(api.groups.getGroupbyInviteCode, { inviteCode });
  const userId = localStorage.getItem("userId");
  const userMembership = useQuery(
    api.users.getMembership,
    userId && group ? { userId, groupId: group._id } : "skip"
  );

  console.log("inviteCode:", inviteCode);
  console.log("userId:", userId);
  console.log("group:", group);
  console.log("userMembership:", userMembership);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    if (!group) {
      setErrors([
        { message: "Invalid invite code. Group not found." } as z.ZodIssue,
      ]);
      return;
    }

    const result = joinGroupSchema.safeParse({ name });

    if (!result.success) {
      setErrors(result.error.issues);
      return;
    }

    if (!userId) return;

    try {
      const { groupId, userId: newUserId } = await joinGroup({
        name: result.data.name,
        inviteCode,
        userId,
      });
      if (!userId) {
        localStorage.setItem("userId", newUserId);
      }
      router.navigate({ to: `/group/${groupId}` });
    } catch (error: any) {
      console.error("Error joining group:", error);
      let errorMessage = "Failed to join group. Please try again.";
      if (error.message && error.message.includes("already a member")) {
        errorMessage = "You are already a member of this group.";
      }
      setErrors([
        {
          message: errorMessage,
        } as z.ZodIssue,
      ]);
    }
  };

  if (group === undefined) {
    return <div>Loading group details...</div>;
  }

  if (group === null) {
    return (
      <div className="container mx-auto p-4 space-y-6 text-center">
        <h1 className="text-3xl font-bold text-destructive">
          Invalid Invite Code
        </h1>
        <p className="text-lg text-muted-foreground">
          The invite code "{inviteCode}" is not valid or the group does not
          exist.
        </p>
        <Button asChild>
          <Link to="/">Go to Home</Link>
        </Button>
      </div>
    );
  }

  if (userMembership === undefined) {
    return <div>Loading membership details...</div>;
  }

  if (userMembership) {
    return (
      <div className="container mx-auto p-4 space-y-6 text-center">
        <h1 className="text-3xl font-bold text-primary">Already a Member</h1>
        <p className="text-lg text-muted-foreground">
          You are already a member of the group "{group.name}".
        </p>
        <Button asChild>
          <Link to={`/group/${group._id}`}>Go to Group</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center text-primary">
        Join Group
      </h1>
      <p className="text-lg text-center text-muted-foreground">
        You are about to join group:{" "}
        <span className="font-semibold text-foreground">{group.name}</span>
      </p>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md mx-auto p-6 bg-card rounded-lg shadow-md"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Your Name
          </label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Bob"
            className="w-full"
          />
          {errors?.find((e) => e.path[0] === "name") && (
            <p className="text-destructive text-sm mt-1">
              {errors.find((e) => e.path[0] === "name")?.message}
            </p>
          )}
        </div>
        {errors && !errors.some((e) => e.path[0] === "name") && (
          <p className="text-destructive text-sm mt-1">{errors[0].message}</p>
        )}
        <Button type="submit" className="w-full">
          Join
        </Button>
      </form>
    </div>
  );
}
