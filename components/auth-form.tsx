'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GitGraph } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-context'
import { DEMO_MEMBERS } from '@/lib/mock-data'
import { ROLE_LABELS } from '@/lib/rbac'

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const isSignup = mode === 'signup'

  function submit(e: React.FormEvent) {
    e.preventDefault()
    login(email || DEMO_MEMBERS[0].user.email)
    router.push('/app/chat')
  }

  function quickLogin(memberEmail: string) {
    login(memberEmail)
    router.push('/app/chat')
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GitGraph className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Engineering Memory OS
            </h1>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              {isSignup
                ? 'Create your organization workspace'
                : 'Sign in to your workspace'}
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
        >
          {isSignup && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Chen"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.dev"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="mt-1 w-full">
            {isSignup ? 'Create workspace' : 'Sign in'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                {"Don't have an account? "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </p>
        </form>

        {/* Demo quick-login to showcase RBAC without a real backend */}
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card/40 p-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Demo accounts — try each role
          </p>
          <div className="flex flex-col gap-1.5">
            {[DEMO_MEMBERS[0], DEMO_MEMBERS[1], DEMO_MEMBERS[4]].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => quickLogin(m.user.email)}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {m.user.name}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {m.user.email}
                  </span>
                </span>
                <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
