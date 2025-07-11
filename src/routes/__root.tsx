import { Outlet, createRootRoute, Link, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
  useSidebar,
} from "../components/ui/sidebar";
import { ThemeToggle } from "../components/theme-toggle";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomeIcon, Users, Menu } from "lucide-react";
import { Button } from "../components/ui/button";

// Header component with hamburger menu
const AppHeader = () => {
  const { isMobile, setOpenMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <div className="flex items-center justify-between border-b bg-background p-4 md:hidden">
      <Link to="/" className="flex items-center gap-2">
        <HomeIcon className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Splitzen</h2>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpenMobile(true)}
        className="md:hidden"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    </div>
  );
};

const RootLayout = () => {
  const userId = localStorage.getItem("userId");
  const groups = useQuery(
    api.groups.getGroupsForUser,
    userId === null ? "skip" : { userId }
  );
  const routerState = useRouterState();
  const currentGroupId = routerState.location.pathname.startsWith("/group/")
    ? routerState.location.pathname.split("/")[2]
    : null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar variant="sidebar" className="border-r">
          <SidebarHeader className="border-b">
            <Link to="/" className="flex items-center gap-2 px-2 py-1">
              <HomeIcon className="h-6 w-6 text-primary" />
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
                  {userId && groups === undefined ? (
                    <div className="flex flex-col items-center justify-center text-center px-4 py-8 space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Loading groups...</p>
                    </div>
                  ) : userId && groups && groups.length > 0 ? (
                    groups.map((group) => (
                      <SidebarMenuItem key={group._id}>
                        <SidebarMenuButton asChild isActive={group._id === currentGroupId}>
                          <Link
                            to="/group/$groupId"
                            params={{ groupId: group._id }}
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

        <SidebarInset className="flex-1">
          <AppHeader />
          <div className="flex h-full w-full flex-col">
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </SidebarInset>
      </div>
      <TanStackRouterDevtools />
    </SidebarProvider>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
