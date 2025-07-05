
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    router.navigate({ to: `/join/${inviteCode}` })
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-2xl font-bold">Welcome to Splitzen!</h3>
      <p className="text-gray-600">A minimal, fast, and privacy-friendly expense splitting app.</p>
      <Button asChild>
        <Link to="/new">Create a new group</Link>
      </Button>

      <form onSubmit={handleJoin} className="space-y-2">
        <label htmlFor="invite-code" className="block text-lg font-medium">Join a group</label>
        <Input
          id="invite-code"
          name="invite-code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Enter invite code"
        />
        <Button type="submit">Join</Button>
      </form>
    </div>
  )
}

