
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/new')({
  component: CreateGroup,
})

function CreateGroup() {
  const createGroup = useMutation(api.groups.create)
  const router = useRouter()
  const [groupName, setGroupName] = useState('')
  const [userName, setUserName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { groupId, sessionId } = await createGroup({ groupName, userName })
    localStorage.setItem(`sessionId_${groupId}`, sessionId)
    router.navigate({ to: `/group/${groupId}` })
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-2xl font-bold">Create a new group</h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="group-name" className="block text-lg font-medium">Group Name</label>
        <Input
          id="group-name"
          name="group-name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name"
        />
        <label htmlFor="user-name" className="block text-lg font-medium">Your Name</label>
        <Input
          id="user-name"
          name="user-name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
        />
        <Button type="submit">Create Group</Button>
      </form>
    </div>
  )
}
