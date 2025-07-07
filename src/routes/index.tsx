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
  const { userId } = Route.useLoaderData();
  console.log("userId from loader:", userId);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({ to: `/join/${inviteCode}` });
  };

  return (
    <div className="flex-grow p-4 flex flex-col justify-center items-center text-center">
      <div className="container mx-auto max-w-lg">
        <h1 className="text-4xl font-extrabold text-primary">
          Welcome to Splitzen!
        </h1>
        <p className="text-lg text-muted-foreground">
          A minimal, fast, and privacy-friendly expense splitting app.
        </p>

        <div className="flex flex-col items-center space-y-4 mt-8">
          <Button asChild className="w-full max-w-sm">
            <Link to="/new">Create a new group</Link>
          </Button>

          <div className="w-full max-w-sm space-y-2">
            <form onSubmit={handleJoin} className="space-y-2">
              <label
                htmlFor="invite-code"
                className="block text-sm font-medium text-foreground"
              >
                Join a group
              </label>
              <Input
                id="invite-code"
                name="invite-code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="w-full"
              />
              <Button type="submit" className="w-full" disabled={!inviteCode}>
                Join
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
