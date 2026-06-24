'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ArrowUp,
  MessageSquarePlus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-context'
import { useChatStore } from '@/lib/use-chat-store'
import { ChatMessage } from '@/components/chat/chat-message'
import { CitationPanel } from '@/components/chat/citation-panel'
import { formatRelative } from '@/lib/fetcher'
import type { Citation } from '@/lib/types'

const STARTER_PROMPTS = [
  'Why did we migrate sessions to rotating JWTs?',
  'Who owns the payments module and what is the bus factor?',
  'What changed in the refund engine recently?',
  'Summarize the decisions behind our auth strategy.',
]

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export function ChatClient() {
  const { member } = useAuth()
  const store = useChatStore()
  const searchParams = useSearchParams()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messages = store.activeSession?.messages ?? []

  // Prefill the composer from a ?q= deep link (e.g. "Ask about this" in the graph).
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setInput(q)
  }, [searchParams])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages.length, store.sending])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || store.sending) return
    setError(null)
    setInput('')
    try {
      await store.sendMessage(trimmed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get a response')
    }
  }

  if (!member) return null
  const userInitials = initials(member.user.name)
  const isEmpty = messages.length === 0 && !store.sending

  return (
    <div className="flex h-full min-h-0">
      {/* Session sidebar */}
      <div className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
        <div className="p-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => store.createSession()}
          >
            <MessageSquarePlus className="size-4" />
            New conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <p className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            History
          </p>
          {store.sessions.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              No conversations yet.
            </p>
          )}
          {store.sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                s.id === store.activeId
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
              onClick={() => store.setActiveId(s.id)}
            >
              <MessageSquarePlus className="size-3.5 shrink-0 opacity-60" />
              <div className="min-w-0 flex-1">
                <p className="truncate">{s.title}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {formatRelative(s.createdAt)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Delete conversation"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  store.deleteSession(s.id)
                }}
              >
                <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6">
            {isEmpty ? (
              <EmptyState onPick={send} />
            ) : (
              <div className="flex flex-col gap-6">
                {messages.map((m) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    userInitials={userInitials}
                    onSelectCitation={setActiveCitation}
                  />
                ))}
                {store.sending && (
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <Sparkles className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0 max-w-[85%] text-pretty text-sm leading-relaxed text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Dot /> <Dot /> <Dot />
                      </span>
                    </div>
                  </div>
                )}
                {error && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border bg-background/80 p-4 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2 focus-within:border-primary/50">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                rows={1}
                placeholder="Ask why code exists, who owns a module, what changed..."
                className="max-h-40 min-h-9 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button
                size="icon"
                disabled={!input.trim() || store.sending}
                onClick={() => send(input)}
                aria-label="Send message"
              >
                <ArrowUp className="size-4" />
              </Button>
            </div>
            <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
              Answers are generated by Qwen over your ingested engineering history.
            </p>
          </div>
        </div>
      </div>

      {/* Citation side panel */}
      {activeCitation && (
        <div className="hidden w-96 shrink-0 xl:block">
          <CitationPanel
            citation={activeCitation}
            onClose={() => setActiveCitation(null)}
          />
        </div>
      )}
    </div>
  )
}

function Dot() {
  return (
    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
  )
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 pt-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15">
        <Sparkles className="size-6 text-primary" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-balance text-xl font-semibold tracking-tight">
          Ask your engineering memory
        </h2>
        <p className="text-pretty text-sm text-muted-foreground">
          Query why code exists, who holds knowledge, and how decisions were made.
        </p>
      </div>
      <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-foreground/90 transition-colors hover:border-primary/50 hover:bg-accent"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
