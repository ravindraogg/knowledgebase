'use client';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { BusinessOutlined, ContentCopyOutlined, GroupOutlined, PersonAddOutlined, SecurityOutlined } from '@mui/icons-material';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

type Repo = { _id: string; name: string };
type Member = { _id: string; name: string; email: string; role: string; status: string; allowedRepoIds?: string[]; allowedSlackChannels?: string[] };
const roles = ['admin', 'member', 'viewer'];

export default function SettingsPage() {
  const permissions = usePermissions();
  const [members, setMembers] = useState<Member[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'member', repoIds: [] as string[], slackChannels: '' });

  const load = async () => {
    if (!permissions.canManageUsers) { setLoading(false); return; }
    try {
      const [memberResponse, repoResponse] = await Promise.all([api.get('/org/members'), api.get('/repos')]);
      setMembers(memberResponse.data); setRepos(repoResponse.data);
    } catch { setError('Unable to load organization members.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [permissions.canManageUsers]);

  const provision = async () => {
    setError(null); setNotice(null);
    try {
      const response = await api.post('/org/members/provision', { ...form, slackChannels: form.slackChannels.split(',').map((item) => item.trim()).filter(Boolean) });
      setCredentials({ email: response.data.user.email, password: response.data.temporaryPassword });
      setNotice('Account created. Copy the temporary password now; it is never shown again.');
      setForm({ name: '', email: '', role: 'member', repoIds: [], slackChannels: '' });
      load();
    } catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to create the user.'); }
  };

  if (loading) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 320 }}><CircularProgress /></Box>;
  return <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Settings</Typography>
    <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 4 }}>Organization controls and role-based access.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
    {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}><Card className="glass-panel"><CardContent><Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}><BusinessOutlined color="primary" /><Typography sx={{ fontWeight: 700 }}>Organization</Typography></Box><Typography variant="body2" color="text.secondary">Your organization name appears in the workspace header instead of the current page name.</Typography></CardContent></Card></Grid>
      <Grid size={{ xs: 12, md: 8 }}><Card className="glass-panel"><CardContent><Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}><SecurityOutlined color="primary" /><Typography sx={{ fontWeight: 700 }}>Role dashboards</Typography></Box><Typography variant="body2" color="text.secondary">Viewer: graph access. Member: search and chat. Admin: repositories, integrations, and members. Owner: full organization controls. The dashboard navigation follows these permissions.</Typography></CardContent></Card></Grid>
      {permissions.canManageUsers && <>
        <Grid size={{ xs: 12 }}><Card className="glass-panel"><CardContent sx={{ p: 3 }}><Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}><PersonAddOutlined color="primary" /><Typography variant="h6" sx={{ fontWeight: 700 }}>Provision a user</Typography></Box><Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}><Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Grid><Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" label="Work email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Grid><Grid size={{ xs: 12, sm: 4 }}><FormControl fullWidth size="small"><InputLabel>Role</InputLabel><Select label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{roles.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}</Select></FormControl></Grid>
            <Grid size={{ xs: 12 }}><Typography variant="caption" sx={{ fontWeight: 700 }}>Repository scope — leave blank for all organization repositories</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', mt: .5 }}>{repos.map((repo) => <Chip key={repo._id} label={repo.name} onClick={() => setForm({ ...form, repoIds: form.repoIds.includes(repo._id) ? form.repoIds.filter((id) => id !== repo._id) : [...form.repoIds, repo._id] })} color={form.repoIds.includes(repo._id) ? 'primary' : 'default'} variant={form.repoIds.includes(repo._id) ? 'filled' : 'outlined'} sx={{ mr: 1, mb: 1 }} />)}</Box></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth size="small" label="Allowed Slack channels (optional)" helperText="Comma-separated channel names, for example: engineering, security" value={form.slackChannels} onChange={(event) => setForm({ ...form, slackChannels: event.target.value })} /></Grid>
            <Grid size={{ xs: 12 }}><Button variant="contained" startIcon={<PersonAddOutlined />} disabled={!form.name || !form.email} onClick={provision}>Generate credentials</Button></Grid></Grid>
          {credentials && <Alert severity="warning" sx={{ mt: 2 }} action={<Button color="inherit" size="small" startIcon={<ContentCopyOutlined />} onClick={() => navigator.clipboard.writeText(credentials.password)}>Copy</Button>}>Temporary password for <strong>{credentials.email}</strong>: <code>{credentials.password}</code></Alert>}
        </CardContent></Card></Grid>
        <Grid size={{ xs: 12 }}><Card className="glass-panel"><CardContent sx={{ p: 3 }}><Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}><GroupOutlined color="primary" /><Typography variant="h6" sx={{ fontWeight: 700 }}>User management</Typography></Box><Table size="small"><TableHead><TableRow><TableCell>User</TableCell><TableCell>Role</TableCell><TableCell>Repository access</TableCell><TableCell>Slack channels</TableCell></TableRow></TableHead><TableBody>{members.map((member) => <TableRow key={member._id}><TableCell><Typography sx={{ fontWeight: 600 }}>{member.name}</Typography><Typography variant="caption">{member.email}</Typography></TableCell><TableCell><Chip size="small" label={member.role} /></TableCell><TableCell>{member.allowedRepoIds?.length ? `${member.allowedRepoIds.length} selected` : 'All repositories'}</TableCell><TableCell>{member.allowedSlackChannels?.length ? member.allowedSlackChannels.join(', ') : 'All channels'}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></Grid>
      </>}
    </Grid>
  </Box>;
}
