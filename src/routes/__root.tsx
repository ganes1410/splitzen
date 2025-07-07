import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../components/ui/sidebar";
import { ThemeToggle } from "../components/theme-toggle";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "@tanstack/react-router";

const RootLayout = () => {
  const userId = localStorage.getItem("userId");
  const groups = useQuery(
    api.groups.getGroupsForUser,
    userId === null ? "skip" : { userId }
  );
  const { state } = useSidebar();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        className={`flex flex-col ${state === "collapsed" ? "w-16" : "w-60"}`}
        collapsible="icon"
      >
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Splitzen</h2>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent className="flex-grow overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupLabel>Your Groups</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userId && groups && groups.length > 0 ? (
                  groups.map((group) => (
                    <SidebarMenuItem key={group._id}>
                      <SidebarMenuButton
                        asChild
                        className="hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Link
                          to="/group/$groupId"
                          params={{ groupId: group._id }}
                        >
                          {group.name}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground p-4 space-y-1">
                    <span className="text-lg">😕</span>
                    <span>No groups found.</span>
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="w-full space-y-2 mt-auto">
          <ThemeToggle />
        </SidebarFooter>
      </Sidebar>

      <div
        className={`flex-grow  p-4 transition-all duration-300 flex align-subject-center justify-center `}
      >
        <Outlet />
      </div>
    </div>
  );
};

export const Route = createRootRoute({
  component: () => (
    <SidebarProvider>
      <RootLayout />
      <TanStackRouterDevtools />
    </SidebarProvider>
  ),
});
