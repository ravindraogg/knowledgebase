// STUB: Replace with real implementation — see project notes.
// Currently returns seeded mock nodes/edges. Will later call a Neo4j-backed
// GraphRAG service. Keep this signature stable so the API route and UI never
// need to change when the real implementation lands.

import { DEMO_GRAPH } from './mock-data'
import type { GraphData } from './types'

export async function queryGraph(orgId: string, query?: string): Promise<GraphData> {
  // Future: translate `query` into a Cypher/GraphRAG traversal scoped to `orgId`.
  void orgId
  if (!query) return DEMO_GRAPH

  const q = query.toLowerCase()
  const matchedNodeIds = new Set(
    DEMO_GRAPH.nodes
      .filter((n) => n.label.toLowerCase().includes(q))
      .map((n) => n.id),
  )
  if (matchedNodeIds.size === 0) return DEMO_GRAPH

  // Include directly connected neighbors of matched nodes.
  DEMO_GRAPH.edges.forEach((e) => {
    if (matchedNodeIds.has(e.source)) matchedNodeIds.add(e.target)
    if (matchedNodeIds.has(e.target)) matchedNodeIds.add(e.source)
  })

  return {
    nodes: DEMO_GRAPH.nodes.filter((n) => matchedNodeIds.has(n.id)),
    edges: DEMO_GRAPH.edges.filter(
      (e) => matchedNodeIds.has(e.source) && matchedNodeIds.has(e.target),
    ),
  }
}
