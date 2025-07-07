
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/')({
  component: Home,
  staticData: {
    title: 'Splitzen - Welcome',
  },
  beforeLoad: () => {
    const userId = localStorage.getItem('userId')
    return { userId }
  },
})

function Home() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const { userId } = Route.useLoaderData()

  const groups = useQuery(api.groups.getGroupsForUser, userId ? { userId } : 'skip')

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    router.navigate({ to: `/join/${inviteCode}` })
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-4xl font-extrabold text-center text-primary">Welcome to Splitzen!</h1>
      <p className="text-lg text-center text-muted-foreground">A minimal, fast, and privacy-friendly expense splitting app.</p>

      {userId && groups && groups.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Your Groups</h2>
          <ul className="space-y-2">
            {groups.map((group) => (
              <li key={group._id} className="bg-card p-4 rounded-lg shadow">
                <Link to={`/group/${group._id}`} className="text-lg font-semibold text-primary-foreground hover:underline">
                  {group.name}
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild className="w-full max-w-sm mx-auto block">
            <Link to="/new">Create a new group</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <Button asChild className="w-full max-w-sm">
            <Link to="/new">Create a new group</Link>
          </Button>

          <div className="w-full max-w-sm space-y-2">
            <form onSubmit={handleJoin} className="space-y-2">
              <label htmlFor="invite-code" className="block text-sm font-medium text-foreground">Join a group</label>
              <Input
                id="invite-code"
                name="invite-code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="w-full"
              />
              <Button type="submit" className="w-full">Join</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

