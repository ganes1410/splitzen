import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { Copy, LogOut } from "lucide-react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
    component: ProfilePage,
});

function ProfilePage() {
    const { userId, userName, login, logout } = useUser();
    const [recoverId, setRecoverId] = useState("");
    const router = useRouter();

    const handleCopy = () => {
        if (userId) {
            navigator.clipboard.writeText(userId);
            toast.success("User ID copied to clipboard");
        }
    };

    const convex = useConvex();

    const handleRecover = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedId = recoverId.trim();
        if (!trimmedId) return;

        try {
            // Check if user exists
            await convex.query(api.users.getUser, { userId: trimmedId });

            // If query succeeds (doesn't throw), user exists
            login(trimmedId);
            setRecoverId("");
            toast.success("Account recovered successfully");
            router.navigate({ to: "/" });
        } catch (error) {
            console.error("Error recovering account:", error);
            toast.error("User not found. Please check the ID and try again.");
            setRecoverId("");
        }
    };

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        router.navigate({ to: "/" });
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl space-y-8">
            <h1 className="text-3xl font-bold">Profile & Settings</h1>

            {userId ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Account</CardTitle>
                        <CardDescription>
                            Manage your current session and account details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Display Name
                            </label>
                            <p className="text-lg font-medium">{userName || "Anonymous"}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                User ID (Save this to recover your account!)
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                                    {userId}
                                </code>
                                <Button variant="outline" size="icon" onClick={handleCopy}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                If you clear your browser data, you will need this ID to restore your groups.
                            </p>
                        </div>

                        <div className="pt-4 border-t">
                            <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
                                <LogOut className="mr-2 h-4 w-4" />
                                Log Out / Clear Session
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Not Logged In</CardTitle>
                        <CardDescription>
                            You are currently not associated with any user account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <a href="/new">Create a New Group to Get Started</a>
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Recover Account</CardTitle>
                    <CardDescription>
                        Lost your session? Enter your User ID below to restore access.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRecover} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="recover-id" className="text-sm font-medium">
                                User ID
                            </label>
                            <Input
                                id="recover-id"
                                placeholder="Paste your User ID here..."
                                value={recoverId}
                                onChange={(e) => setRecoverId(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={!recoverId.trim()}>
                            Recover Account
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
