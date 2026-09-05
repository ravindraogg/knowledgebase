'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Box, Typography, Card, CardContent, Button, Chip,
  CircularProgress, Grid, Alert, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, TextField,
} from '@mui/material';
import {
  GitHub, LinkOutlined, LinkOffOutlined, CheckCircleOutlined,
  ErrorOutlined, AddOutlined, DeleteOutlined, RefreshOutlined,
} from '@mui/icons-material';
import type { Integration } from '@/types';

const GITHUB_OAUTH_URL = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ''}&redirect_uri=${typeof window !== 'undefined' ? window.location.origin : ''}/api/github/callback&scope=repo,read:user`;

const INTEGRATION_CONFIGS = {
  github: {
    name: 'GitHub',
    icon: GitHub,
    color: '#818CF8',
    desc: 'Connect your GitHub organization to ingest commits, PRs, and code reviews.',
    fields: [{ key: 'accessToken', label: 'Personal Access Token', placeholder: 'ghp_...', type: 'password' }],
    oauth: true,
  },
  jira: {
    name: 'Jira',
    icon: null,
    color: '#38BDF8',
    desc: 'Connect Jira to link tickets with commits and code changes.',
    fields: [
      { key: 'baseUrl', label: 'Jira Base URL', placeholder: 'https://your-domain.atlassian.net', type: 'url' },
      { key: 'email', label: 'Email', placeholder: 'you@company.com', type: 'email' },
      { key: 'apiToken', label: 'API Token', placeholder: 'your-api-token', type: 'password' },
    ],
  },
  slack: {
    name: 'Slack',
    icon: null,
    color: '#FBBF24',
    desc: 'Connect Slack to map discussions to code entities and decisions.',
    fields: [
      { key: 'botToken', label: 'Bot Token', placeholder: 'xoxb-...', type: 'password' },
      { key: 'signingSecret', label: 'Signing Secret', placeholder: 'your-signing-secret', type: 'password' },
    ],
  },
};

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [connectDialog, setConnectDialog] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const githubConnected = searchParams.get('github');
    const githubError = searchParams.get('github_error');
    if (githubConnected === 'connected') {
      setSuccessMsg('GitHub connected successfully!');
      router.replace('/dashboard/integrations');
    } else if (githubError) {
      setError(decodeURIComponent(githubError));
      router.replace('/dashboard/integrations');
    }
  }, [searchParams, router]);

  const fetchIntegrations = async () => {
    try {
      const res = await api.get('/integrations');
      setIntegrations(res.data);
    } catch (err) {
      setError('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIntegrations(); }, []);

  const handleGithubOAuth = () => {
    window.location.href = GITHUB_OAUTH_URL;
  };

  const handleConnect = async (type: string) => {
    setConnecting(true);
    setError(null);
    try {
      await api.post(`/integrations/${type}`, formValues);
      setConnectDialog(null);
      setFormValues({});
      await fetchIntegrations();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to connect integration');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      await api.delete(`/integrations/${id}`);
      await fetchIntegrations();
    } catch (err) {
      setError('Failed to disconnect integration');
    }
  };

  const handleTest = async (id: string) => {
    try {
      const res = await api.get(`/integrations/${id}/test`);
      if (res.data.healthy) {
        setIntegrations((prev) => prev.map((i) => i._id === id ? { ...i, status: 'active' as const } : i));
      }
    } catch (err) {
      setError('Connection test failed');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <CircularProgress color="primary" />
    </Box>;
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 'var(--space-6)' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 'var(--space-1)' }}>Integrations</Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
            Connect your tools to feed data into Recalix's knowledge graph.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 'var(--space-4)', borderRadius: 'var(--radius-md)' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 'var(--space-4)', borderRadius: 'var(--radius-md)' }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      <Grid container spacing={4}>
        {Object.entries(INTEGRATION_CONFIGS).map(([type, config]) => {
          const existing = integrations.find((i) => i.type === type);
          const Icon = config.icon;
          const statusColors: Record<string, string> = { active: 'var(--color-success)', revoked: 'var(--color-error)', error: 'var(--color-warning)' };

          return (
            <Grid size={{ xs: 12, md: 6 }} key={type}>
              <Card className="glass-panel" sx={{ borderRadius: 'var(--radius-xl)', height: '100%' }}>
                <CardContent sx={{ p: 'var(--space-6)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', mb: 'var(--space-3)' }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                      backgroundColor: `${config.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {Icon ? <Icon sx={{ color: config.color, fontSize: 24 }} /> : (
                        <Typography sx={{ color: config.color, fontWeight: 800, fontSize: '16px' }}>{config.name[0]}</Typography>
                      )}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '16px' }}>{config.name}</Typography>
                      {existing && (
                        <Chip label={existing.status} size="small"
                          sx={{
                            height: 20, fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
                            backgroundColor: `${statusColors[existing.status]}20`,
                            color: statusColors[existing.status], borderRadius: 'var(--radius-sm)',
                          }} />
                      )}
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, mb: 'var(--space-4)', fontSize: '13px' }}>
                    {config.desc}
                  </Typography>

                  {existing ? (
                    <Box sx={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button size="small" variant="outlined" startIcon={<RefreshOutlined />}
                        onClick={() => handleTest(existing._id)}
                        sx={{ borderRadius: 'var(--radius-md)', fontSize: '12px', borderColor: 'var(--color-border-glass)' }}>
                        Test
                      </Button>
                      <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutlined />}
                        onClick={() => handleDisconnect(existing._id)}
                        sx={{ borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                        Disconnect
                      </Button>
                    </Box>
                  ) : type === 'github' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <Button variant="contained" startIcon={<GitHub />} onClick={handleGithubOAuth}
                        sx={{
                          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px',
                          background: `linear-gradient(135deg, #24292e, #57606a)`,
                          '&:hover': { opacity: 0.9 },
                        }}>
                        Sign in with GitHub
                      </Button>
                      <Button variant="text" size="small" startIcon={<AddOutlined />} onClick={() => setConnectDialog(type)}
                        sx={{ borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                        Or use a Personal Access Token
                      </Button>
                    </Box>
                  ) : (
                    <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setConnectDialog(type)}
                      sx={{
                        borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px',
                        background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
                        '&:hover': { opacity: 0.9 },
                      }}>
                      Connect {config.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Connect Dialog */}
      <Dialog open={!!connectDialog} onClose={() => { setConnectDialog(null); setFormValues({}); }}
        slotProps={{ paper: { sx: { borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-bg-elevated)', backdropFilter: 'blur(24px)', maxWidth: 480 } } }}>
        {connectDialog && (() => {
          const config = INTEGRATION_CONFIGS[connectDialog as keyof typeof INTEGRATION_CONFIGS];
          return (
            <>
              <DialogTitle sx={{ fontWeight: 700 }}>Connect {config.name}</DialogTitle>
              <DialogContent>
                <DialogContentText sx={{ mb: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
                  {config.desc}
                </DialogContentText>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {config.fields.map((field) => (
                    <TextField key={field.key} label={field.label} type={field.type} fullWidth size="small"
                      placeholder={field.placeholder} value={formValues[field.key] || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))} />
                  ))}
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 'var(--space-4)', pt: 0 }}>
                <Button onClick={() => { setConnectDialog(null); setFormValues({}); }}
                  sx={{ borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)' }}>
                  Cancel
                </Button>
                <Button variant="contained" disabled={connecting} onClick={() => handleConnect(connectDialog)}
                  sx={{ borderRadius: 'var(--radius-md)', fontWeight: 600,
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                  {connecting ? <CircularProgress size={18} color="inherit" /> : 'Connect'}
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
