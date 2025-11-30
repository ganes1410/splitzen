import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet, ArrowRight, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  staticData: {
    title: "Splitzen - Welcome",
  },
  loader: () => {
    if (typeof window === "undefined") {
      return { userId: null };
    }
    const userId = localStorage.getItem("userId");
    return { userId };
  },
});

function Home() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({ to: `/join/${inviteCode}` });
  };

  return (
    <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)] p-4 md:p-8 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Splitzen
          </h1>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto">
            The easiest way to split expenses with friends and family.
          </p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Get Started</CardTitle>
            <CardDescription>
              Create a new group or join an existing one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button asChild className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:-translate-y-0.5">
              <Link to="/new" className="flex items-center justify-center gap-2">
                Create a new group
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-medium">
                  Or join with code
                </span>
              </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-3">
              <div className="space-y-1">
                <Input
                  id="invite-code"
                  name="invite-code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g. abc-123"
                  className="h-12 bg-background/50"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full h-12 font-medium hover:bg-accent hover:text-accent-foreground"
                disabled={!inviteCode}
              >
                <Users className="w-4 h-4 mr-2" />
                Join Group
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Simple. Fast. Privacy-friendly.
        </p>
      </div>
    </div>
  );
}
