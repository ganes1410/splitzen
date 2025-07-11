import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { GroupSettingsForm } from "@/components/group-settings-form";

export const Route = createFileRoute("/settings/$groupId")({
  component: GroupSettingsPage,
});

function GroupSettingsPage() {
  const { groupId } = Route.useParams();
  const router = useRouter();
  const group = useQuery(api.groups.getGroup, { groupId: groupId as Id<"groups"> });
  const users = useQuery(api.users.getUsersInGroup, { groupId: groupId as Id<"groups"> });
  const updateGroup = useMutation(api.groups.update);
  const updateGroupMembers = useMutation(api.groups.updateGroupMembers);
  const addUserToGroup = useMutation(api.users.addUserToGroup);

  if (!group || !users) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col sm:ml-40 px-3">
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
      />
    </div>
  );
}

