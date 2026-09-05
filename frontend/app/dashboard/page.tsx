'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Grid, Card, CardContent, Typography, Box, List, ListItem,
  ListItemText, CircularProgress, Chip, Button,
} from '@mui/material';
import {
  FolderOutlined, AccountTreeOutlined, SyncOutlined,
  CheckCircleOutlined, ErrorOutlined, ScheduleOutlined,
  CodeOutlined,
} from '@mui/icons-material';
import Link from 'next/link';
import type { GraphStats, IngestionRun } from '@/types';

const statusColors: Record<string, string> = {
  completed: 'var(--color-success)', running: 'var(--color-warning)',
  failed: 'var(--color-error)', queued: 'var(--color-info)',
  cancelled: 'var(--color-text-tertiary)',
};
const statusBg: Record<string, string> = {
  completed: 'rgba(74,222,128,0.12)', running: 'rgba(251,191,36,0.12)',
  failed: 'rgba(248,113,113,0.12)', queued: 'rgba(96,165,250,0.12)',
  cancelled: 'rgba(100,116,139,0.12)',
};

export default function DashboardHome() {
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, runsRes] = await Promise.all([
          api.get('/graph/stats'),
          api.get('/ingestion/runs'),
        ]);
        setStats(statsRes.data);
        setRuns(runsRes.data.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="primary" />
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mt: 'var(--space-3)' }}>Loading workspace...</Typography>
        </Box>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Nodes Indexed', value: stats?.nodeCount ?? 0, icon: AccountTreeOutlined,
      desc: 'Functions, files, and modules parsed.', color: '#818CF8',
    },
    {
      title: 'Relationships Mapped', value: stats?.edgeCount ?? 0, icon: CodeOutlined,
      desc: 'Dependencies and structural hierarchies.', color: '#38BDF8',
    },
    {
      title: 'Active Ingests', value: runs.filter(r => r.status === 'running').length, icon: SyncOutlined,
      desc: 'Sync runs processing in the background.', color: '#FBBF24',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - var(--space-12))' }}>
      {/* Sticky header — does not scroll */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--color-bg-base)', pb: 'var(--space-4)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 'var(--space-1)' }}>Dashboard</Typography>
            <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
              Overview of your knowledge graph and recent activity.
            </Typography>
          </Box>
          <Button component={Link} href="/dashboard/query" variant="contained"
            sx={{ borderRadius: 'var(--radius-full)', fontWeight: 600, px: 'var(--space-5)',
              backgroundColor: 'var(--color-primary)' }}>
            Ask a Question
          </Button>
        </Box>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Grid container spacing={3} sx={{ mb: 'var(--space-8)' }}>
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.title}>
                <Card className="glass-panel glass-glow" sx={{ borderRadius: 'var(--radius-xl)', height: '100%' }}>
                  <CardContent sx={{ p: 'var(--space-6)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 'var(--space-3)' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {card.title}
                        </Typography>
                      </Box>
                      <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', backgroundColor: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon sx={{ color: card.color, fontSize: 20 }} />
                      </Box>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 'var(--space-1)', letterSpacing: '-0.02em' }}>
                      {card.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                      {card.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 'var(--space-4)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Ingestion Runs</Typography>
          <Button component={Link} href="/dashboard/ingestion" variant="text" size="small"
            sx={{ borderRadius: 'var(--radius-md)', color: 'var(--color-primary)', fontWeight: 600 }}>
            View All
          </Button>
        </Box>

        <Card className="glass-panel" sx={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          {runs.length === 0 ? (
            <Box sx={{ py: 'var(--space-8)', textAlign: 'center' }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 'var(--space-3)' }}>
                <SyncOutlined sx={{ color: 'var(--color-primary)', fontSize: 22 }} />
              </Box>
              <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                No ingestion runs yet. Connect a repository to get started.
              </Typography>
              <Button component={Link} href="/dashboard/repos" variant="outlined" size="small"
                sx={{ mt: 'var(--space-3)', borderRadius: 'var(--radius-full)' }}>
                Connect a Repository
              </Button>
            </Box>
          ) : (
            <List disablePadding>
              {runs.map((run, idx) => (
                <ListItem key={run._id}
                  sx={{
                    px: 'var(--space-6)', py: 'var(--space-4)',
                    borderBottom: idx < runs.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                  }}>
                  <ListItemText
                    slotProps={{ primary: { component: 'div' }, secondary: { component: 'div' } }}
                    primary={
                      <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                        {run.repoId && typeof run.repoId === 'object' ? run.repoId.name : 'Repository'}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', mt: 'var(--space-1)' }}>
                        <Typography sx={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                          {run.createdAt ? new Date(run.createdAt).toLocaleString() : ''}
                        </Typography>
                        {run.stats && (
                          <Typography sx={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                            &middot; {run.stats.entitiesCreated} entities, {run.stats.edgesCreated} edges
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Chip label={run.status}
                    sx={{
                      height: 24, fontSize: '11px', fontWeight: 700, textTransform: 'capitalize',
                      backgroundColor: statusBg[run.status] || 'var(--color-bg-surface)',
                      color: statusColors[run.status] || 'var(--color-text-secondary)',
                      borderRadius: 'var(--radius-full)',
                    }} />
                </ListItem>
              ))}
            </List>
          )}
        </Card>
      </Box>
    </Box>
  );
}
