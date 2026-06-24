'use client'

import { FileCode2, GitPullRequest, Hash, MessageSquare, ScrollText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Citation } from '@/lib/types'

const KIND_ICON = {
  pr: GitPullRequest,
  slack: MessageSquare,
  function: FileCode2,
  jira: Hash,
  adr: ScrollText,
} as const

const KIND_LABEL = {
  pr: 'Pull Request',
  slack: 'Slack Thread',
  function: 'Code',
  jira: 'Jira Issue',
  adr: 'Decision Record',
} as const

export function CitationPanel({
  citation,
  onClose,
}: {
  citation: Citation
  onClose: () => void
}) {
  const Icon = KIND_ICON[citation.kind]
  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-card">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <span className="text-sm font-medium">Source artifact</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel">
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Badge variant="outline" className="mb-3 gap-1">
          <Icon className="size-3" />
          {KIND_LABEL[citation.kind]}
        </Badge>
        <h3 className="text-pretty text-sm font-semibold">
          {citation.source.title}
        </h3>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {citation.source.meta}
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-muted/40">
          <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {citation.source.language ?? 'snippet'}
            </span>
          </div>
          <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-foreground/90">
            <code>{citation.source.body}</code>
          </pre>
        </div>

        <p className="mt-4 text-pretty text-xs text-muted-foreground">
          This is seeded demo content. Once the backend is connected, citations
          link to the live artifact in GitHub, Jira, or Slack.
        </p>
      </div>
    </div>
  )
}
