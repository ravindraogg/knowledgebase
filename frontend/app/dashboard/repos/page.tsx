'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, TextField, Chip, Grid,
} from '@mui/material';
import {
  FolderOutlined, AddOutlined, DeleteOutlined, SyncOutlined,
  ArrowForwardOutlined, LinkOutlined, CheckCircleOutlined,
  GitHub,
  HistoryOutlined,
  AccountTreeOutlined,
} from '@mui/icons-material';
import type { Repository } from '@/types';
import { useAuth } from '@/components/AuthProvider';

interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  cloneUrl: string;
  defaultBranch: string;
  language: string;
  private: boolean;
  updatedAt: string;
}

export default function ReposPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Repository | null>(null);
  const [form, setForm] = useState({ name: '', repoUrl: '', branch: 'main' });
  const [saving, setSaving] = useState(false);
  const [githubDialog, setGithubDialog] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [building, setBuilding] = useState<string | null>(null);

  const fetchRepos = async () => {
    try {
      const res = await api.get('/repos');
      setRepos(res.data);
    } catch (err) {
      setError('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRepos(); }, []);

  const openGithubDialog = async () => {
    setGithubDialog(true);
    setLoadingGithub(true);
    setError(null);
    try {
      const res = await api.get('/github/repos');
      setGithubRepos(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to load GitHub repos. Make sure GitHub is connected in Integrations.');
    } finally {
      setLoadingGithub(false);
    }
  };

  const importGithubRepo = async (fullName: string) => {
    setImporting(fullName);
    setError(null);
    try {
      const [owner, name] = fullName.split('/');
      await api.post(`/github/repos/${owner}/${name}/import`);
      setGithubRepos((prev) => prev.filter((r) => r.fullName !== fullName));
      await fetchRepos();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to import repository');
    } finally {
      setImporting(null);
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.repoUrl.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.post('/repos', form);
      setAddDialog(false);
      setForm({ name: '', repoUrl: '', branch: 'main' });
      await fetchRepos();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to add repository');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/repos/${deleteTarget._id}`);
      setDeleteTarget(null);
      await fetchRepos();
    } catch (err) {
      setError('Failed to delete repository');
    }
  };

  const handleScan = async (repoId: string) => {
    try {
      await api.post('/ingestion/trigger', { repoId });
    } catch (err) {
      setError('Failed to trigger ingestion');
    }
  };

  const handleSyncCommits = async (repoId: string) => {
    setSyncing(repoId);
    setError(null);
    try {
      const res = await api.post(`/github/repos/${repoId}/sync`);
      if (res.data.synced > 0) {
        setError(null);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to sync commits');
    } finally {
      setSyncing(null);
    }
  };

  const handleBuildKnowledgeBase = async (repoId: string) => {
    setBuilding(repoId);
    setError(null);
    try {
      await api.post(`/github/repos/${repoId}/build-kb`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to build knowledge base');
    } finally {
      setBuilding(null);
    }
  };

  const isGithubRepo = (repo: Repository) => repo.name.includes('/');

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <CircularProgress color="primary" />
    </Box>;
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 'var(--space-6)' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 'var(--space-1)' }}>{user?.orgName || 'Organization'}</Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
            Manage the codebases Recalix ingests and analyzes.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outlined" startIcon={<GitHub />} onClick={openGithubDialog}
            sx={{ borderRadius: 'var(--radius-full)', fontWeight: 600, px: 'var(--space-4)',
              borderColor: 'var(--color-border-default)' }}>
            Import from GitHub
          </Button>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setAddDialog(true)}
            sx={{ borderRadius: 'var(--radius-full)', fontWeight: 600, px: 'var(--space-4)',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
            Add Repository
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 'var(--space-4)', borderRadius: 'var(--radius-md)' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {repos.length === 0 ? (
        <Card className="glass-panel" sx={{ borderRadius: 'var(--radius-xl)', textAlign: 'center', py: 'var(--space-10)' }}>
          <CardContent>
            <Box sx={{ width: 64, height: 64, borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 'var(--space-4)' }}>
              <FolderOutlined sx={{ fontSize: 28, color: 'var(--color-primary)' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 'var(--space-2)' }}>No repositories connected</Typography>
            <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 'var(--space-5)', maxWidth: 450, mx: 'auto' }}>
              Import a GitHub repo to build a complete knowledge base — code entities, commits, and change history visualized in the graph explorer.
            </Typography>
            <Box sx={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
              <Button variant="contained" startIcon={<GitHub />} onClick={openGithubDialog}
                sx={{ borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                Import from GitHub
              </Button>
              <Button variant="outlined" startIcon={<AddOutlined />} onClick={() => setAddDialog(true)}
                sx={{ borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                Add Manually
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {repos.map((repo) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={repo._id}>
              <Card className="glass-panel glass-panel-interactive"
                sx={{ borderRadius: 'var(--radius-xl)', height: '100%', cursor: 'pointer' }}
                onClick={() => router.push(`/dashboard/repos/${repo._id}`)}>
                <CardContent sx={{ p: 'var(--space-5)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', mb: 'var(--space-3)' }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FolderOutlined sx={{ color: 'var(--color-primary)', fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {repo.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '10px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {repo.repoUrl}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', mb: 'var(--space-4)' }}>
                    <Chip label={repo.branch} size="small"
                      sx={{ height: 20, fontSize: '10px', fontWeight: 600, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(129,140,248,0.1)', color: '#818CF8' }} />
                    <Chip label={repo.status} size="small"
                      sx={{ height: 20, fontSize: '10px', fontWeight: 600, borderRadius: 'var(--radius-sm)',
                        backgroundColor: repo.status === 'active' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                        color: repo.status === 'active' ? 'var(--color-success)' : 'var(--color-error)' }} />
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {isGithubRepo(repo) && (
                      <Button size="small" variant="contained" startIcon={building === repo._id ? <CircularProgress size={12} color="inherit" /> : <AccountTreeOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleBuildKnowledgeBase(repo._id); }}
                        disabled={building === repo._id}
                        sx={{ borderRadius: 'var(--radius-md)', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap',
                          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                        {building === repo._id ? 'Building...' : 'Build KB'}
                      </Button>
                    )}
                    <Button size="small" variant="outlined" startIcon={<SyncOutlined />}
                      onClick={(e) => { e.stopPropagation(); handleScan(repo._id); }}
                      sx={{ borderRadius: 'var(--radius-md)', fontSize: '11px', flex: 1, borderColor: 'var(--color-border-glass)' }}>
                      Scan
                    </Button>
                    {isGithubRepo(repo) && (
                      <Button size="small" variant="outlined" startIcon={syncing === repo._id ? <CircularProgress size={12} color="inherit" /> : <HistoryOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleSyncCommits(repo._id); }}
                        disabled={syncing === repo._id}
                        sx={{ borderRadius: 'var(--radius-md)', fontSize: '11px', borderColor: 'var(--color-border-glass)', whiteSpace: 'nowrap' }}>
                        {syncing === repo._id ? 'Syncing...' : 'Commits'}
                      </Button>
                    )}
                    <IconButton size="small" color="error"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(repo); }}
                      sx={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-glass)' }}>
                      <DeleteOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small"
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/repos/${repo._id}`); }}
                      sx={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-glass)' }}>
                      <ArrowForwardOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)}
        slotProps={{ paper: { sx: { borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-bg-elevated)', backdropFilter: 'blur(24px)', maxWidth: 480, width: '100%' } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Repository</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
            Enter the details of the repository you want to ingest into the knowledge graph.
          </DialogContentText>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <TextField label="Repository Name" required fullWidth size="small"
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="My Project" />
            <TextField label="Repository URL" required fullWidth size="small"
              value={form.repoUrl} onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))}
              placeholder="https://github.com/user/repo.git or /local/path" />
            <TextField label="Branch" fullWidth size="small"
              value={form.branch} onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
              placeholder="main" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 'var(--space-4)', pt: 0 }}>
          <Button onClick={() => setAddDialog(false)} sx={{ borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)' }}>Cancel</Button>
          <Button variant="contained" disabled={saving || !form.name || !form.repoUrl} onClick={handleAdd}
            sx={{ borderRadius: 'var(--radius-md)', fontWeight: 600, background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Add Repository'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        slotProps={{ paper: { sx: { borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-bg-elevated)', backdropFilter: 'blur(24px)', maxWidth: 400 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Remove Repository?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'var(--color-text-secondary)' }}>
            This will permanently delete "{deleteTarget?.name}" and purge all associated graph data from Neo4j. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 'var(--space-4)', pt: 0 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}
            sx={{ borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
            <DeleteOutlined sx={{ mr: 'var(--space-1)', fontSize: 16 }} /> Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* GitHub Import Dialog */}
      <Dialog open={githubDialog} onClose={() => setGithubDialog(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-bg-elevated)', backdropFilter: 'blur(24px)', minHeight: 300 } } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <GitHub sx={{ fontSize: 22 }} /> Import from GitHub
        </DialogTitle>
        <DialogContent>
          {loadingGithub ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 'var(--space-10)' }}>
              <CircularProgress color="primary" />
            </Box>
          ) : githubRepos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 'var(--space-6)' }}>
              <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                No GitHub repos found. Make sure GitHub is connected in Integrations.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {githubRepos.map((gr) => {
                const alreadyImported = repos.some((r) => r.name === gr.fullName);
                return (
                  <Card key={gr.id} sx={{ backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                    <CardContent sx={{ p: 'var(--space-3)', '&:last-child': { pb: 'var(--space-3)' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <GitHub sx={{ fontSize: 18, color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>
                            {gr.fullName}
                          </Typography>
                          {gr.description && (
                            <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)', fontSize: '11px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {gr.description}
                            </Typography>
                          )}
                        </Box>
                        {gr.language && (
                          <Chip label={gr.language} size="small" sx={{ height: 20, fontSize: '10px', borderRadius: 'var(--radius-sm)' }} />
                        )}
                        <Button
                          size="small"
                          variant={alreadyImported ? 'outlined' : 'contained'}
                          disabled={alreadyImported || importing === gr.fullName}
                          onClick={() => importGithubRepo(gr.fullName)}
                          sx={{ borderRadius: 'var(--radius-md)', fontSize: '11px', flexShrink: 0, fontWeight: 600 }}
                        >
                          {importing === gr.fullName ? <CircularProgress size={14} color="inherit" /> : alreadyImported ? 'Imported' : 'Import'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 'var(--space-3)', pt: 0 }}>
          <Button onClick={() => setGithubDialog(false)} sx={{ borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
