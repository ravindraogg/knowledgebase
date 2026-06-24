"use client"

import { X, ArrowRight, MessageSquare } from "lucide-react"
import Link from "next/link"
import type { GraphNode, GraphData } from "@/lib/types"
import { NODE_STYLES } from "@/lib/node-style"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface NodeDetailProps {
  node: GraphNode
  graph: GraphData
  onClose: () => void
  onFocusNode: (id: string) => void
}

export function NodeDetail({ node, graph, onClose, onFocusNode }: NodeDetailProps) {
  const meta = NODE_STYLES[node.type]
  const connections = graph.edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => {
      const otherId = e.source === node.id ? e.target : e.source
      const other = graph.nodes.find((n) => n.id === otherId)
      return other ? { node: other, relation: e.label } : null
    })
    .filter((c): c is { node: GraphNode; relation: string } => c !== null)

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{meta.label}</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close details">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-4">
          <div>
            <h3 className="font-mono text-base font-semibold text-card-foreground text-pretty">{node.label}</h3>
          </div>

          {node.metadata.length > 0 && (
            <dl className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
              {node.metadata.map((m) => (
                <div key={m.label} className="flex items-start justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">{m.label}</dt>
                  <dd className="text-right font-medium text-card-foreground">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Connections ({connections.length})
            </p>
            <div className="space-y-1.5">
              {connections.map(({ node: c, relation }) => {
                const cMeta = NODE_STYLES[c.type]
                return (
                  <button
                    key={c.id + relation}
                    onClick={() => onFocusNode(c.id)}
                    className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-left transition-colors hover:bg-accent"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cMeta.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{c.label}</p>
                      <p className="truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        {relation}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <Button asChild className="w-full" variant="secondary">
          <Link href={`/app/chat?q=${encodeURIComponent(`Tell me about ${node.label}`)}`}>
            <MessageSquare className="h-4 w-4" />
            Ask about this
          </Link>
        </Button>
      </div>
    </div>
  )
}
