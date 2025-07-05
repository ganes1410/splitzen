
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/join/$inviteCode')({
  component: JoinGroup,
})

function JoinGroup() {
  const { inviteCode } = Route.useParams()
  const joinGroup = useMutation(api.users.join)
  const router = useRouter()
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { sessionId, groupId } = await joinGroup({ name, inviteCode })
    // Store session ID in local storage for future use
    localStorage.setItem(`sessionId_${groupId}`, sessionId)
    router.navigate({ to: `/group/${groupId}` });
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center text-primary">Join Group</h1>
      <p className="text-lg text-center text-muted-foreground">
        You are about to join a group with invite code: <span className="font-semibold text-foreground">{inviteCode}</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Your Name</label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Bob"
            className="w-full"
          />
        </div>
        <Button type="submit" className="w-full">Join</Button>
      </form>
    </div>
  )
}
