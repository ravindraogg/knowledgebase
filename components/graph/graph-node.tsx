"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { NodeType } from "@/lib/types"
import { NODE_STYLES } from "@/lib/node-style"

export function GraphNode({ data, selected }: NodeProps) {
  const type = data.type as NodeType
  const meta = NODE_STYLES[type]
  const Icon = meta.icon

  return (
    <div
      className="flex min-w-[150px] max-w-[220px] items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 shadow-sm transition-all"
      style={{
        borderColor: selected ? meta.color : "var(--border)",
        boxShadow: selected ? `0 0 0 2px ${meta.color}` : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-muted-foreground" />
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `color-mix(in oklch, ${meta.color} 18%, transparent)`, color: meta.color }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-tight text-card-foreground">{data.label as string}</p>
        <p className="truncate text-xs text-muted-foreground">{data.sublabel as string}</p>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-muted-foreground" />
    </div>
  )
}
