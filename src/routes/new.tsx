
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
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center text-primary">Create a New Group</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
        <div>
          <label htmlFor="group-name" className="block text-sm font-medium text-foreground mb-1">Group Name</label>
          <Input
            id="group-name"
            name="group-name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g., Japan Trip 2025"
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="user-name" className="block text-sm font-medium text-foreground mb-1">Your Name</label>
          <Input
            id="user-name"
            name="user-name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g., Alice"
            className="w-full"
          />
        </div>
        <Button type="submit" className="w-full">Create Group</Button>
      </form>
    </div>
  )
}
