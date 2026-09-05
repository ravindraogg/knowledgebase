'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Box, Typography, Card, CircularProgress, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Alert,
} from '@mui/material';
import {
  CheckCircleOutlined, SyncOutlined, ErrorOutlined,
  ScheduleOutlined, CancelOutlined, StorageOutlined,
} from '@mui/icons-material';
import type { IngestionRun } from '@/types';

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  completed: { color: 'var(--color-success)', bg: 'rgba(74,222,128,0.12)', icon: CheckCircleOutlined },
  running: { color: 'var(--color-warning)', bg: 'rgba(251,191,36,0.12)', icon: SyncOutlined },
  failed: { color: 'var(--color-error)', bg: 'rgba(248,113,113,0.12)', icon: ErrorOutlined },
  queued: { color: 'var(--color-info)', bg: 'rgba(96,165,250,0.12)', icon: ScheduleOutlined },
  cancelled: { color: 'var(--color-text-tertiary)', bg: 'rgba(100,116,139,0.12)', icon: CancelOutlined },
};

export default function IngestionPage() {
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const res = await api.get('/ingestion/runs');
        setRuns(res.data);
        setError(null);
      } catch (err) {
        setError('Failed to load ingestion runs');
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();
    const interval = setInterval(fetchRuns, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <CircularProgress color="primary" />
    </Box>;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 'var(--space-6)' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 'var(--space-1)' }}>Ingestion Runs</Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
            History of all sync operations. Auto-refreshes every 5 seconds.
          </Typography>
        </Box>
        <Chip icon={<SyncOutlined sx={{ fontSize: 14 }} />} label="Live" size="small" color="primary"
          sx={{ borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '11px', animation: 'pulse 2s infinite' }} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>{error}</Alert>}

      {runs.length === 0 ? (
        <Card className="glass-panel" sx={{ borderRadius: 'var(--radius-xl)', textAlign: 'center', py: 'var(--space-10)' }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 'var(--space-3)' }}>
            <StorageOutlined sx={{ color: 'var(--color-primary)', fontSize: 22 }} />
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 'var(--space-1)' }}>No ingestion runs yet</Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
            Connect a repository and trigger a scan to see ingestion history here.
          </Typography>
        </Card>
      ) : (
        <Card className="glass-panel" sx={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>Repository</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>Started</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>Entities</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>Edges</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {runs.map((run) => {
                  const config = statusConfig[run.status] || statusConfig.completed;
                  const Icon = config.icon;
                  const startDate = run.startedAt ? new Date(run.startedAt) : null;
                  const endDate = run.completedAt ? new Date(run.completedAt) : null;
                  const duration = startDate && endDate ? `${Math.round((endDate.getTime() - startDate.getTime()) / 1000)}s` : '-';
                  return (
                    <TableRow key={run._id} sx={{ '&:hover': { backgroundColor: 'var(--color-primary-subtle)' } }}>
                      <TableCell>
                        <Chip icon={<Icon sx={{ fontSize: 14 }} />} label={run.status}
                          sx={{ height: 26, fontWeight: 700, fontSize: '11px', textTransform: 'capitalize',
                            backgroundColor: config.bg, color: config.color, borderRadius: 'var(--radius-full)' }} />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '13px' }}>
                          {typeof run.repoId === 'object' && run.repoId ? run.repoId.name : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {startDate ? startDate.toLocaleString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {duration}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '13px' }}>
                          {run.stats?.entitiesCreated ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '13px' }}>
                          {run.stats?.edgesCreated ?? '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
