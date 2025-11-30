import { useRouter, Link, createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { GroupSettingsForm } from "@/components/group-settings-form";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/$groupId/settings")({
  component: GroupSettingsPage,
});

function GroupSettingsPage() {
  const { groupId } = Route.useParams();
  const router = useRouter();
  const group = useQuery(api.groups.getGroup, {
    groupId: groupId as Id<"groups">,
  });
  const users = useQuery(api.users.getUsersInGroup, {
    groupId: groupId as Id<"groups">,
  });
  const updateGroup = useMutation(api.groups.update);
  const updateGroupMembers = useMutation(api.groups.updateGroupMembers);
  const addUserToGroup = useMutation(api.users.addUserToGroup);
  const removeUserFromGroup = useMutation(api.users.removeUserFromGroup);

  if (!group || !users) {
    return (
      <div className="flex flex-col sm:ml-40 px-4 py-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:ml-40 px-4 py-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center mb-6">
        <Link
          to="/group/$groupId"
          params={{ groupId }}
          search={{
            sortBy: "dateDesc",
            filterBy: "",
          }}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Button variant="ghost" size="sm" className="pl-0 pr-2 hover:bg-transparent">
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="text-base font-medium">Back to {group?.name}</span>
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Group Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your group details and members
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Update group name, currency, and manage members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GroupSettingsForm
              group={group}
              allParticipants={users}
              initialSelectedParticipants={users.map((u) => u._id)}
              onSubmit={async (data) => {
                await updateGroup({
                  groupId: group._id,
                  name: data.name,
                  currency: data.currency,
                });
                await updateGroupMembers({
                  groupId: group._id,
                  selectedParticipantIds: data.selectedParticipantIds,
                });
                router.navigate({
                  to: "/group/$groupId",
                  params: { groupId },
                  search: {
                    sortBy: "dateDesc",
                    filterBy: "",
                  },
                });
              }}
              onCancel={() =>
                router.navigate({
                  to: "/group/$groupId",
                  params: { groupId },
                  search: {
                    sortBy: "dateDesc",
                    filterBy: "",
                  },
                })
              }
              addUserToGroup={async (name) => {
                return await addUserToGroup({
                  name,
                  groupId: groupId as Id<"groups">,
                });
              }}
              removeUserFromGroup={async (userId, groupId) => {
                await removeUserFromGroup({ userId, groupId });
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
