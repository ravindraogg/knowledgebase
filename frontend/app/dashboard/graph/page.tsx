'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Box, Button, Card, Chip, CircularProgress, IconButton, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import { AccountTreeOutlined, CenterFocusStrongOutlined, CloseOutlined, FullscreenExitOutlined, FullscreenOutlined, ZoomInOutlined, ZoomOutOutlined } from '@mui/icons-material';
import type { Repository } from '@/types';

interface GraphNode { id: string; label: string; type: string; path: string; }
interface GraphEdge { from: string; to: string; type: string; }
interface NetworkControls { destroy: () => void; fit: (options?: object) => void; moveTo: (options: object) => void; }

const nodeTypes = [
  { key: 'file', label: 'File', color: '#6366F1' },
  { key: 'class', label: 'Class', color: '#0EA5E9' },
  { key: 'function', label: 'Function', color: '#8B5CF6' },
  { key: 'method', label: 'Method', color: '#10B981' },
  { key: 'interface', label: 'Interface', color: '#F59E0B' },
  { key: 'commit', label: 'Commit', color: '#EF4444' },
] as const;

const nodeColors: Record<string, string> = Object.fromEntries(nodeTypes.map(({ key, color }) => [key, color]));

export default function GraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphPanelRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<NetworkControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [stats, setStats] = useState({ nodeCount: 0, edgeCount: 0 });
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    api.get('/repos').then((response) => setRepos(response.data)).catch(() => setRepos([]));
  }, []);

  useEffect(() => {
    async function loadGraph() {
      setLoading(true);
      setError('');
      try {
        const params = selectedRepoId ? { repoId: selectedRepoId } : undefined;
        const [graphRes, statsRes] = await Promise.all([api.get('/graph/explore', { params }), api.get('/graph/stats', { params })]);
        setGraph({ nodes: graphRes.data.nodes || [], edges: graphRes.data.edges || [] });
        setStats(statsRes.data);
      } catch {
        setError('We could not load the knowledge graph. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadGraph();
  }, [selectedRepoId]);

  useEffect(() => {
    const syncFullscreenState = () => {
      const fullscreen = document.fullscreenElement === graphPanelRef.current;
      setIsFullscreen(fullscreen);
      if (fullscreen) window.setTimeout(() => networkRef.current?.fit({ animation: { duration: 250, easingFunction: 'easeInOutQuad' } }), 100);
    };
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  const visibleGraph = useMemo(() => {
    const nodes = activeTypes.length ? graph.nodes.filter((node) => activeTypes.includes(node.type)) : graph.nodes;
    const nodeIds = new Set(nodes.map((node) => node.id));
    return { nodes, edges: graph.edges.filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to)) };
  }, [activeTypes, graph]);

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current || loading || visibleGraph.nodes.length === 0) return;

    async function drawNetwork() {
      const { Network } = await import('vis-network/standalone');
      if (cancelled || !containerRef.current) return;

      networkRef.current?.destroy();
      const nodes = visibleGraph.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        title: `${node.type}\n${node.path || 'No path available'}`,
        color: { background: nodeColors[node.type] || '#64748B', border: 'rgba(255,255,255,.85)', highlight: { background: '#A5B4FC', border: '#FFFFFF' } },
        font: { color: '#FFFFFF', face: 'DM Sans', size: 13, bold: { color: '#FFFFFF', face: 'DM Sans' } },
        shape: node.type === 'commit' ? 'dot' : 'box',
        size: node.type === 'commit' ? 15 : undefined,
        margin: { top: 9, right: 12, bottom: 9, left: 12 },
        borderRadius: 8,
      }));
      const edges = visibleGraph.edges.map((edge) => ({
        from: edge.from,
        to: edge.to,
        label: edge.type === 'CONTAINS' ? '' : edge.type,
        arrows: { to: { enabled: true, scaleFactor: 0.55 } },
        color: { color: 'rgba(203, 213, 225, .42)', highlight: '#A5B4FC', hover: '#A5B4FC' },
        font: { size: 9, color: 'rgba(226,232,240,.82)', face: 'DM Sans', align: 'top' },
      }));

      const network = new Network(containerRef.current, { nodes, edges }, {
        autoResize: true,
        nodes: { borderWidth: 1.5, shadow: { enabled: true, color: 'rgba(0,0,0,.28)', size: 8, x: 0, y: 3 } },
        edges: { width: 1.2, smooth: { enabled: true, type: 'dynamic', roundness: 0.35 } },
        physics: { stabilization: { enabled: true, iterations: 140, fit: true }, barnesHut: { gravitationalConstant: -2800, centralGravity: 0.25, springLength: 120, springConstant: 0.035, damping: 0.16 } },
        interaction: { hover: true, tooltipDelay: 180, navigationButtons: false, keyboard: true, multiselect: false, zoomView: true },
      });
      network.on('selectNode', ({ nodes: ids }: { nodes: string[] }) => setSelectedNode(visibleGraph.nodes.find((node) => node.id === ids[0]) || null));
      network.on('deselectNode', () => setSelectedNode(null));
      networkRef.current = network;
    }
    drawNetwork();
    return () => { cancelled = true; networkRef.current?.destroy(); networkRef.current = null; };
  }, [loading, visibleGraph]);

  const toggleType = (type: string) => setActiveTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  const zoom = (scale: number) => networkRef.current?.moveTo({ scale, animation: { duration: 220, easingFunction: 'easeInOutQuad' } });
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await graphPanelRef.current?.requestFullscreen();
  };

  return (
    <Box sx={{ height: 'calc(100vh - var(--topbar-height) - var(--space-12))', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 'var(--space-3)', mb: 'var(--space-4)', flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 'var(--space-1)' }}>Knowledge graph</Typography>
          <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>Explore {stats.nodeCount} entities and {stats.edgeCount} relationships in {selectedRepoId ? repos.find((repo) => repo._id === selectedRepoId)?.name || 'the selected repository' : 'all repositories'}.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Select value={selectedRepoId} onChange={(event) => { setSelectedNode(null); setActiveTypes([]); setSelectedRepoId(event.target.value); }} displayEmpty size="small" sx={{ minWidth: 190, bgcolor: 'var(--color-bg-elevated)', fontSize: 12, '& .MuiSelect-select': { py: '6px' } }}>
            <MenuItem value=""><em>All repositories</em></MenuItem>
            {repos.map((repo) => <MenuItem key={repo._id} value={repo._id}>{repo.name}</MenuItem>)}
          </Select>
          {nodeTypes.map((type) => <Chip key={type.key} label={type.label} size="small" onClick={() => toggleType(type.key)} variant={activeTypes.length === 0 || activeTypes.includes(type.key) ? 'filled' : 'outlined'} sx={{ cursor: 'pointer', height: 26, fontWeight: 700, fontSize: 11, color: activeTypes.length === 0 || activeTypes.includes(type.key) ? '#fff' : 'var(--color-text-secondary)', bgcolor: activeTypes.length === 0 || activeTypes.includes(type.key) ? type.color : 'transparent', borderColor: type.color, '&:hover': { bgcolor: type.color, color: '#fff' } }} />)}
        </Box>
      </Box>

      <Card ref={graphPanelRef} className="glass-panel" sx={{ flexGrow: 1, minHeight: 400, position: 'relative', overflow: 'hidden', bgcolor: '#101525', borderColor: 'rgba(255,255,255,.12)', '&:fullscreen': { width: '100vw', height: '100vh', borderRadius: 0 } }}>
        <Box sx={{ position: 'absolute', top: 'var(--space-3)', left: 'var(--space-3)', zIndex: 3, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', px: 'var(--space-3)', py: 'var(--space-2)', borderRadius: 'var(--radius-md)', color: '#E7EAFE', bgcolor: 'rgba(16,21,37,.84)', border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(10px)' }}><AccountTreeOutlined sx={{ fontSize: 17, color: '#A5B4FC' }} /><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{visibleGraph.nodes.length} visible nodes</Typography></Box>
        <Box sx={{ position: 'absolute', right: 'var(--space-3)', bottom: 'var(--space-3)', zIndex: 3, display: 'grid', gap: 'var(--space-1)', p: '4px', borderRadius: 'var(--radius-md)', bgcolor: 'rgba(16,21,37,.84)', border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(10px)' }}>
          <Tooltip title={isFullscreen ? 'Exit full screen' : 'Full screen'}><IconButton onClick={toggleFullscreen} size="small" sx={{ color: '#fff' }}>{isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}</IconButton></Tooltip>
          <Tooltip title="Zoom in"><IconButton onClick={() => zoom(1.25)} size="small" sx={{ color: '#fff' }}><ZoomInOutlined /></IconButton></Tooltip>
          <Tooltip title="Zoom out"><IconButton onClick={() => zoom(0.8)} size="small" sx={{ color: '#fff' }}><ZoomOutOutlined /></IconButton></Tooltip>
          <Tooltip title="Fit graph"><IconButton onClick={() => networkRef.current?.fit({ animation: { duration: 300, easingFunction: 'easeInOutQuad' } })} size="small" sx={{ color: '#fff' }}><CenterFocusStrongOutlined /></IconButton></Tooltip>
        </Box>
        {selectedNode && <Box sx={{ position: 'absolute', right: 'var(--space-3)', top: 'var(--space-3)', zIndex: 3, width: 280, p: 'var(--space-3)', borderRadius: 'var(--radius-md)', color: '#EEF2FF', bgcolor: 'rgba(16,21,37,.94)', border: '1px solid rgba(255,255,255,.14)', boxShadow: 'var(--shadow-elevation-3)', backdropFilter: 'blur(12px)' }}><IconButton onClick={() => setSelectedNode(null)} size="small" sx={{ position: 'absolute', top: 4, right: 4, color: 'rgba(255,255,255,.7)' }}><CloseOutlined sx={{ fontSize: 16 }} /></IconButton><Chip label={selectedNode.type} size="small" sx={{ height: 20, mb: 'var(--space-2)', fontSize: 10, fontWeight: 700, bgcolor: nodeColors[selectedNode.type] || '#64748B', color: '#fff' }} /><Typography sx={{ fontWeight: 700, fontSize: 14, pr: 'var(--space-4)', overflowWrap: 'anywhere' }}>{selectedNode.label}</Typography><Typography sx={{ mt: 'var(--space-2)', color: 'rgba(238,242,255,.7)', fontFamily: 'var(--font-mono)', fontSize: 11, overflowWrap: 'anywhere' }}>{selectedNode.path || 'No file path available'}</Typography></Box>}
        {loading && <Box sx={{ position: 'absolute', inset: 0, zIndex: 5, display: 'grid', placeItems: 'center', gap: 'var(--space-3)', color: '#fff', bgcolor: 'rgba(16,21,37,.9)' }}><CircularProgress sx={{ color: '#A5B4FC', justifySelf: 'center' }} /><Typography sx={{ fontSize: 13 }}>Building the graph view…</Typography></Box>}
        {!loading && error && <Box sx={{ position: 'absolute', inset: 0, zIndex: 5, display: 'grid', placeItems: 'center', p: 'var(--space-8)', textAlign: 'center', color: '#fff' }}><Box><Typography sx={{ fontWeight: 700 }}>{error}</Typography><Button onClick={() => window.location.reload()} size="small" sx={{ mt: 'var(--space-2)', color: '#A5B4FC' }}>Retry</Button></Box></Box>}
        {!loading && !error && graph.nodes.length === 0 && <Box sx={{ position: 'absolute', inset: 0, zIndex: 5, display: 'grid', placeItems: 'center', p: 'var(--space-8)', textAlign: 'center', color: '#fff' }}><Box><Typography sx={{ fontWeight: 700, mb: 'var(--space-1)' }}>No graph data available</Typography><Typography sx={{ color: 'rgba(238,242,255,.7)', fontSize: 13 }}>Import a repository and build its knowledge base to visualize relationships here.</Typography></Box></Box>}
        {!loading && !error && graph.nodes.length > 0 && visibleGraph.nodes.length === 0 && <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, display: 'grid', placeItems: 'center', color: '#fff', pointerEvents: 'none' }}><Typography sx={{ p: 'var(--space-3)', borderRadius: 'var(--radius-md)', bgcolor: 'rgba(16,21,37,.84)' }}>No nodes match the selected filters.</Typography></Box>}
        <Box ref={containerRef} sx={{ width: '100%', height: '100%', bgcolor: '#101525', backgroundImage: 'radial-gradient(rgba(165,180,252,.14) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      </Card>
    </Box>
  );
}
