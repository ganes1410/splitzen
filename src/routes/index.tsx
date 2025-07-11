import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  component: Home,
  staticData: {
    title: "Splitzen - Welcome",
  },
  loader: () => {
    // Initialize userId to null for SSR, then hydrate on client
    if (typeof window === 'undefined') {
      return { userId: null };
    }
    const userId = localStorage.getItem("userId");
    return { userId };
  },
});

function Home() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const { userId } = Route.useLoaderData();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({ to: `/join/${inviteCode}` });
  };

  return (
    <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-8rem)] p-6">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Welcome to Splitzen!
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            A minimal, fast, and privacy-friendly expense splitting app.
          </p>
        </div>

        <div className="space-y-6">
          <Button asChild className="w-full text-base h-11">
            <Link to="/new">Create a new group</Link>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <form
            onSubmit={handleJoin}
            className="bg-muted/10 border border-border p-6 rounded-xl shadow-sm space-y-4"
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
              className="h-11"
            />
            <Button
              type="submit"
              className="w-full h-11"
              disabled={!inviteCode}
            >
              Join
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
