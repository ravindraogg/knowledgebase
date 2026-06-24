"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import useSWR from "swr"
import { Search, Filter, Loader2 } from "lucide-react"
import type { GraphData, NodeType } from "@/lib/types"
import { NODE_STYLES, allNodeTypes } from "@/lib/node-style"
import { fetcher } from "@/lib/fetcher"
import { GraphNode } from "./graph-node"
import { NodeDetail } from "./node-detail"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const nodeTypes = { entity: GraphNode }

// Deterministic radial layout grouped by node type.
function layout(graph: GraphData): { nodes: Node[]; edges: Edge[] } {
  const byKind: Record<string, typeof graph.nodes> = {}
  for (const n of graph.nodes) {
    byKind[n.type] = byKind[n.type] ?? []
    byKind[n.type].push(n)
  }
  const kinds = Object.keys(byKind)
  const nodes: Node[] = []
  const clusterRadius = 520

  kinds.forEach((kind, ki) => {
    const clusterAngle = (ki / kinds.length) * Math.PI * 2
    const cx = Math.cos(clusterAngle) * clusterRadius
    const cy = Math.sin(clusterAngle) * clusterRadius
    const group = byKind[kind]
    group.forEach((n, i) => {
      const a = (i / Math.max(group.length, 1)) * Math.PI * 2
      const r = 80 + group.length * 16
      nodes.push({
        id: n.id,
        type: "entity",
        position: { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r },
        data: { label: n.label, sublabel: n.metadata[0]?.value ?? "", type: n.type },
      })
    })
  })

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: false,
    style: { stroke: "var(--border)", strokeWidth: 1.5 },
  }))

  return { nodes, edges }
}

function GraphInner() {
  const { data: graph, isLoading } = useSWR<GraphData>("/api/graph", fetcher)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeFilters, setActiveFilters] = useState<NodeType[]>([...allNodeTypes])

  useEffect(() => {
    if (!graph) return
    const { nodes: n, edges: e } = layout(graph)
    setNodes(n)
    setEdges(e)
  }, [graph, setNodes, setEdges])

  // Apply search + filter dimming.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => {
        const kind = node.data.type as NodeType
        const matchesFilter = activeFilters.includes(kind)
        const matchesSearch =
          !search ||
          (node.data.label as string).toLowerCase().includes(search.toLowerCase()) ||
          (node.data.sublabel as string).toLowerCase().includes(search.toLowerCase())
        const visible = matchesFilter && matchesSearch
        return { ...node, style: { opacity: visible ? 1 : 0.12 } }
      }),
    )
  }, [search, activeFilters, setNodes])

  const selectedNode = useMemo(
    () => graph?.nodes.find((n) => n.id === selectedId) ?? null,
    [graph, selectedId],
  )

  const toggleFilter = (t: NodeType) => {
    setActiveFilters((prev) => (prev.includes(t) ? prev.filter((f) => f !== t) : [...prev, t]))
  }

  const focusNode = useCallback(
    (id: string) => {
      setSelectedId(id)
      setNodes((prev) => prev.map((n) => ({ ...n, selected: n.id === id })))
    },
    [setNodes],
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading knowledge graph...
      </div>
    )
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
        <p className="text-sm font-medium text-foreground">No knowledge graph yet</p>
        <p className="max-w-sm text-sm text-pretty">
          Connect GitHub, Jira, or Slack from the Integrations page to ingest your engineering
          history and build the memory graph.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="relative flex-1">
        {/* Toolbar */}
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-3">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entities..."
              className="bg-card pl-8"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card/90 p-2 backdrop-blur">
            <Filter className="ml-1 mr-0.5 h-3.5 w-3.5 text-muted-foreground" />
            {allNodeTypes.map((t) => {
              const meta = NODE_STYLES[t]
              const active = activeFilters.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => toggleFilter(t)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                    active ? "border-transparent text-foreground" : "border-border text-muted-foreground opacity-60",
                  )}
                  style={active ? { backgroundColor: `color-mix(in oklch, ${meta.color} 18%, transparent)` } : undefined}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => focusNode(node.id)}
          onPaneClick={() => {
            setSelectedId(null)
            setNodes((prev) => prev.map((n) => ({ ...n, selected: false })))
          }}
          fitView
          minZoom={0.2}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
          <Controls className="!border-border !bg-card [&_button]:!border-border [&_button]:!bg-card [&_button]:!fill-foreground [&_button:hover]:!bg-accent" />
          <MiniMap
            pannable
            zoomable
            className="!bg-card"
            maskColor="color-mix(in oklch, var(--background) 70%, transparent)"
            nodeColor={(n) => NODE_STYLES[n.data.type as NodeType]?.color ?? "var(--muted)"}
          />
        </ReactFlow>
      </div>

      {selectedNode && graph && (
        <NodeDetail node={selectedNode} graph={graph} onClose={() => setSelectedId(null)} onFocusNode={focusNode} />
      )}
    </div>
  )
}

export function GraphClient() {
  return (
    <ReactFlowProvider>
      <GraphInner />
    </ReactFlowProvider>
  )
}
