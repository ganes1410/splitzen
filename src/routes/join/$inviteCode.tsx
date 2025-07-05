
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
    <div className="p-4 space-y-4">
      <h3 className="text-2xl font-bold">Join Group</h3>
      <p className="text-gray-600">You are about to join a group with invite code: <span className="font-semibold">{inviteCode}</span></p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="name" className="block text-lg font-medium">Your Name</label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        <Button type="submit">Join</Button>
      </form>
    </div>
  )
}
