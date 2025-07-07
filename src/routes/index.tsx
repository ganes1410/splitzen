import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface IndexLoaderData {
  userId: string | null;
}

export const Route = createFileRoute("/")<IndexLoaderData>({
  component: Home,
  staticData: {
    title: "Splitzen - Welcome",
  },
  loader: () => {
    const userId = localStorage.getItem("userId");
    return { userId };
  },
});

function Home() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const { userId } = Route.useLoaderData() as IndexLoaderData;
  console.log("userId from loader:", userId ?? "undefined");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({ to: `/join/${inviteCode}` });
  };

  return (
    <div className="flex flex-1 justify-start p-4 ">
      <div className="w-full max-w-md text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">
            Welcome to Splitzen!
          </h1>
          <p className="text-muted-foreground text-base">
            A minimal, fast, and privacy-friendly expense splitting app.
          </p>
        </div>

        <Button asChild className="w-full text-base">
          <Link to="/new">Create a new group</Link>
        </Button>

        <form
          onSubmit={handleJoin}
          className="bg-muted/10 border border-border p-5 rounded-xl shadow-sm space-y-4"
        >
          <label
            htmlFor="invite-code"
            className="block text-sm font-medium text-left text-foreground"
          >
            Join a group
          </label>
          <Input
            id="invite-code"
            name="invite-code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter invite code"
          />
          <Button type="submit" className="w-full" disabled={!inviteCode}>
            Join
          </Button>
        </form>
      </div>
    </div>
  );
}
