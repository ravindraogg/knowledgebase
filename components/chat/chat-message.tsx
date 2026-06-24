'use client'

import { FileCode2, GitPullRequest, Hash, MessageSquare, ScrollText, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { DecisionTrail } from '@/components/chat/decision-trail'
import type { Citation, ChatMessage as ChatMessageType } from '@/lib/types'

const KIND_ICON = {
  pr: GitPullRequest,
  slack: MessageSquare,
  function: FileCode2,
  jira: Hash,
  adr: ScrollText,
} as const

function CitationChip({
  citation,
  onSelect,
}: {
  citation: Citation
  onSelect: (c: Citation) => void
}) {
  const Icon = KIND_ICON[citation.kind]
  return (
    <button
      type="button"
      onClick={() => onSelect(citation)}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-foreground/80 transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground"
    >
      <Icon className="size-3 text-primary" />
      {citation.label}
    </button>
  )
}

export function ChatMessage({
  message,
  userInitials,
  onSelectCitation,
}: {
  message: ChatMessageType
  userInitials: string
  onSelectCitation: (c: Citation) => void
}) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.content}
        </div>
        <Avatar className="mt-0.5 size-7 shrink-0">
          <AvatarFallback className="bg-secondary text-xs">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Sparkles className="size-4 text-primary" />
      </div>
      <div className="min-w-0 max-w-[85%]">
        {message.decisionTrail && message.decisionTrail.length > 0 && (
          <DecisionTrail steps={message.decisionTrail} />
        )}
        <div className="text-pretty text-sm leading-relaxed text-foreground">
          <Markdownish text={message.content} />
        </div>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {message.citations.map((c) => (
              <CitationChip
                key={c.id}
                citation={c}
                onSelect={onSelectCitation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Minimal inline renderer: supports **bold** and `code` spans.
function Markdownish({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <p>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}
