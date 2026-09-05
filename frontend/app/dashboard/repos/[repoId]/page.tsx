'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Box, Typography, Card, CardContent, Button, Chip,
  CircularProgress, Grid, List, ListItem, ListItemText,
  Alert, IconButton, Divider,
} from '@mui/material';
import {
  ArrowBackOutlined, FolderOutlined, CodeOutlined,
  SyncOutlined, CheckCircleOutlined, ErrorOutlined,
  ScheduleOutlined, CallSplitOutlined, CommitOutlined,
  PersonOutlined, CalendarTodayOutlined,
} from '@mui/icons-material';
import type { Repository, IngestionRun, GraphNode } from '@/types';

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
const statusIcons: Record<string, React.ElementType> = {
  completed: CheckCircleOutlined, running: SyncOutlined,
  failed: ErrorOutlined, queued: ScheduleOutlined,
};

function formatDate(date: any): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  } catch {
    return '';
  }
}

export default function RepoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const repoId = params.repoId as string;

  const [repo, setRepo] = useState<Repository | null>(null);
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [entities, setEntities] = useState<GraphNode[]>([]);
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [repoRes, runsRes, entitiesRes, commitsRes] = await Promise.all([
          api.get(`/repos/${repoId}`),
          api.get(`/ingestion/runs`),
          api.get(`/repos/${repoId}/entities`),
          api.get(`/repos/${repoId}/commits`).catch(() => ({ data: { commits: [] } })),
        ]);
        setRepo(repoRes.data);
        setRuns(runsRes.data.filter((r: IngestionRun) =>
          (r.repoId && typeof r.repoId === 'object' && r.repoId._id === repoId)
        ));
        setEntities(entitiesRes.data.entities || []);
        setCommits(commitsRes.data.commits || []);
      } catch (err) {
        setError('Failed to load repository details');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [repoId]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <CircularProgress color="primary" />
    </Box>;
  }

  if (error || !repo) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center', py: 'var(--space-10)' }}>
        <Alert severity="error" sx={{ borderRadius: 'var(--radius-md)' }}>{error || 'Repository not found'}</Alert>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.push('/dashboard/repos')}
          sx={{ mt: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>Back to Repos</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', mb: 'var(--space-6)' }}>
        <IconButton onClick={() => router.push('/dashboard/repos')} sx={{ color: 'var(--color-text-secondary)' }}>
          <ArrowBackOutlined />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <FolderOutlined sx={{ color: 'var(--color-primary)', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{repo.name}</Typography>
            <Chip label={repo.status} size="small"
              sx={{
                height: 22, fontSize: '11px', fontWeight: 700,
                backgroundColor: repo.status === 'active' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                color: repo.status === 'active' ? 'var(--color-success)' : 'var(--color-error)',
                borderRadius: 'var(--radius-sm)',
              }} />
          </Box>
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px', mt: 'var(--space-1)' }}>
            {repo.repoUrl} {repo.branch !== 'main' && `(${repo.branch})`}
          </Typography>
        </Box>
      </Box>

      {/* Branch info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', mb: 'var(--space-5)' }}>
        <CallSplitOutlined sx={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
        <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '12px' }}>Branch:</Typography>
        <Chip
          icon={<CallSplitOutlined sx={{ fontSize: 13 }} />}
          label={repo.branch || 'main'}
          size="small"
          sx={{ height: 22, fontSize: '11px', fontWeight: 600, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)' }}
        />
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 'var(--space-6)' }}>
        {[
          { label: 'Code Entities', value: entities.length, icon: CodeOutlined, color: '#818CF8' },
          { label: 'Recent Commits', value: commits.length, icon: CommitOutlined, color: '#EF4444' },
          { label: 'Last Ingest', value: runs[0]?.createdAt ? new Date(runs[0].createdAt).toLocaleDateString() : 'Never', icon: ScheduleOutlined, color: '#A78BFA' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
              <Card className="glass-panel" sx={{ borderRadius: 'var(--radius-lg)' }}>
                <CardContent sx={{ p: 'var(--space-5)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 'var(--space-1)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {stat.label}
                    </Typography>
                    <Icon sx={{ color: stat.color, fontSize: 22 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={4}>
        {/* Ingestion History */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 'var(--space-3)' }}>Ingestion History</Typography>
          <Card className="glass-panel" sx={{ borderRadius: 'var(--radius-lg)', maxHeight: 400, overflow: 'auto' }}>
            {runs.length === 0 ? (
              <Box sx={{ py: 'var(--space-6)', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>No ingestion runs yet.</Typography>
              </Box>
            ) : (
              <List dense>
                {runs.map((run) => {
                  const StatusIcon = statusIcons[run.status] || ScheduleOutlined;
                  return (
                    <ListItem key={run._id} sx={{ borderBottom: '1px solid var(--color-border-subtle)', '&:last-child': { borderBottom: 'none' } }}>
                      <ListItemText
                        slotProps={{ secondary: { component: 'div' } }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <StatusIcon sx={{ fontSize: 16, color: statusColors[run.status] || 'var(--color-text-tertiary)' }} />
                            <Typography sx={{ fontWeight: 600, fontSize: '13px', textTransform: 'capitalize' }}>{run.status}</Typography>
                          </Box>
                        }
                        secondary={
                          <Typography sx={{ fontSize: '11px', color: 'var(--color-text-tertiary)', mt: 'var(--space-1)' }}>
                            {run.createdAt ? new Date(run.createdAt).toLocaleString() : ''}
                            {run.stats ? ` \u2022 ${run.stats.entitiesCreated} entities, ${run.stats.edgesCreated} edges` : ''}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Card>
        </Grid>

        {/* Code Entities */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 'var(--space-3)' }}>Code Entities</Typography>
          <Card className="glass-panel" sx={{ borderRadius: 'var(--radius-lg)', maxHeight: 400, overflow: 'auto' }}>
            {entities.length === 0 ? (
              <Box sx={{ py: 'var(--space-6)', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>No entities parsed yet. Trigger an ingestion run.</Typography>
              </Box>
            ) : (
              <List dense>
                {entities.map((entity) => (
                  <ListItem key={entity.id} sx={{ borderBottom: '1px solid var(--color-border-subtle)', '&:last-child': { borderBottom: 'none' } }}>
                    <ListItemText
                      slotProps={{ secondary: { component: 'div' } }}
                      primary={<Typography sx={{ fontWeight: 600, fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{entity.label}</Typography>}
                      secondary={<Typography sx={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{entity.type} &middot; {entity.path}</Typography>}
                    />
                    <Chip label={entity.type} size="small"
                      sx={{ height: 20, fontSize: '10px', fontWeight: 600, borderRadius: 'var(--radius-sm)' }} />
                  </ListItem>
                ))}
              </List>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Top 5 Recent Commits */}
      <Box sx={{ mt: 'var(--space-6)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 'var(--space-3)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <CommitOutlined sx={{ fontSize: 20, color: '#EF4444' }} />
            Recent Commits
          </Box>
        </Typography>
        <Card className="glass-panel" sx={{ borderRadius: 'var(--radius-lg)' }}>
          {commits.length === 0 ? (
            <Box sx={{ py: 'var(--space-6)', textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>No commits synced yet.</Typography>
            </Box>
          ) : (
            <List dense>
              {commits.map((c: any, idx: number) => (
                <Box key={c.sha}>
                  {idx > 0 && <Divider sx={{ borderColor: 'var(--color-border-subtle)' }} />}
                  <ListItem sx={{ px: 'var(--space-5)', py: 'var(--space-3)' }}>
                    <ListItemText
                      slotProps={{ secondary: { component: 'div' } }}
                      primary={
                        <Typography sx={{ fontWeight: 600, fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                          {(c.message || '').split('\n')[0]}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', mt: 'var(--space-1)', flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                            <PersonOutlined sx={{ fontSize: 12, color: 'var(--color-text-tertiary)' }} />
                            <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>{c.author || 'unknown'}</Typography>
                          </Box>
                          {c.date && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                              <CalendarTodayOutlined sx={{ fontSize: 11, color: 'var(--color-text-tertiary)' }} />
                              <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>{formatDate(c.date)}</Typography>
                            </Box>
                          )}
                          <Chip label={c.sha?.substring(0, 7)} size="small"
                            sx={{ height: 18, fontSize: '9px', fontFamily: 'var(--font-mono)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }} />
                        </Box>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Card>
      </Box>
    </Box>
  );
}
