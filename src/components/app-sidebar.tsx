import { HomeIcon, Menu, Users, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
  Sidebar,
} from "./ui/sidebar";
import { useQuery } from "convex/react";
import { useRouterState, Outlet, Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { ThemeToggle } from "./theme-toggle";
import { useEffect, useState } from "react";

const AppHeader = () => {
  const { isMobile, setOpenMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <div className="sticky top-0 left-0 right-0 z-10 flex items-center justify-between border-b bg-background/80 backdrop-blur-md w-full px-4 py-3 md:hidden">
      <Link to="/" className="flex items-center gap-2">
        <div className="bg-primary/10 p-1.5 rounded-lg">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">Splitzen</h2>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpenMobile(true)}
        className="md:hidden hover:bg-muted"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    </div>
  );
};

const AppSidebar = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setUserId(localStorage.getItem("userId"));
  }, []);

  const groups = useQuery(
    api.groups.getGroupsForUser,
    userId === null ? "skip" : { userId }
  );
  const routerState = useRouterState();
  const currentGroupId = routerState.location.pathname.startsWith("/group/")
    ? routerState.location.pathname.split("/")[2]
    : routerState.location.pathname.match(/^\/([a-zA-Z0-9]+)\/settings$/)
      ? routerState.location.pathname.match(/^\/([a-zA-Z0-9]+)\/settings$/)?.[1]
      : null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar variant="sidebar" className="border-r">
          <SidebarHeader className="border-b">
            <Link to="/" className="flex items-center gap-2 px-2 py-1">
              <Wallet className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Splitzen</h2>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-2 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Your Groups
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {!hasMounted || (userId && groups === undefined) ? (
                    <div className="flex flex-col items-center justify-center text-center px-4 py-8 space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Loading groups...
                      </p>
                    </div>
                  ) : userId && groups && groups.length > 0 ? (
                    groups.map((group) => (
                      <SidebarMenuItem key={group._id}>
                        <SidebarMenuButton
                          asChild
                          isActive={group._id === currentGroupId}
                        >
                          <Link
                            to="/group/$groupId"
                            params={{ groupId: group._id }}
                            search={{
                              sortBy: "dateDesc",
                              filterBy: "",
                            }}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md"
                          >
                            <Users className="h-4 w-4" />
                            <span className="truncate">{group.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center px-4 py-8 space-y-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          No groups yet
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Create or join a group to get started
                        </p>
                      </div>
                    </div>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-2">
            <ThemeToggle />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1  md:pt-0">
          <AppHeader />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
export default AppSidebar;
