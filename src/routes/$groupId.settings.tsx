import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { GroupSettingsForm } from "@/components/group-settings-form";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col sm:ml-40 px-3">
      <div className="flex items-center mb-4">
        <Link
          to="/group/$groupId"
          params={{ groupId }}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Button variant="ghost" size="sm" className="px-2">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-lg font-medium">Back to {group?.name}</span>
          </Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-4 text-primary">
        {group?.name} - Settings
      </h1>
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
          router.navigate({ to: "/group/$groupId", params: { groupId } });
        }}
        onCancel={() =>
          router.navigate({ to: "/group/$groupId", params: { groupId } })
        }
        addUserToGroup={async (name) => {
          await addUserToGroup({ name, groupId: groupId as Id<"groups"> });
        }}
        removeUserFromGroup={async (userId, groupId) => {
          await removeUserFromGroup({ userId, groupId });
        }}
      />
    </div>
  );
}
