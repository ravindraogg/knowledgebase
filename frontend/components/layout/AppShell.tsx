'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { Box, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Chip, Tooltip, Divider, TextField, Menu, MenuItem } from '@mui/material';
import { DashboardOutlined, SearchOutlined, AccountTreeOutlined, FolderOutlined, SyncOutlined, SettingsOutlined, ExtensionOutlined, ChatBubbleOutlineOutlined, ChevronLeftOutlined, ChevronRightOutlined, LogoutOutlined, AddOutlined, AutoGraphOutlined as SparklesOutlined, HistoryOutlined, SourceOutlined, MoreHorizOutlined, EditOutlined, DeleteOutlined, FolderCopyOutlined } from '@mui/icons-material';
import { api } from '@/lib/api';

interface NavItem { name: string; href: string; icon: React.ElementType; permission?: boolean; }

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const permissions = usePermissions();
  const [collapsed, setCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const isChatPage = pathname === '/dashboard/chat';

  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<{ id: string; el: HTMLElement } | null>(null);

  const fetchHistory = () => {
    if (isChatPage && !chatCollapsed) {
      api.get('/query/history').then(r => setRecentQueries(r.data.slice(0, 20))).catch(() => {});
    }
  };

  useEffect(() => {
    if (isChatPage) {
      setCollapsed(true);
      fetchHistory();
    }
  }, [isChatPage, chatCollapsed]);

  const navItems: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: DashboardOutlined }, { name: 'Ask recalix', href: '/dashboard/chat', icon: ChatBubbleOutlineOutlined, permission: permissions.canQuery },
    { name: 'Search', href: '/dashboard/query', icon: SearchOutlined, permission: permissions.canQuery }, { name: 'Knowledge graph', href: '/dashboard/graph', icon: AccountTreeOutlined, permission: permissions.canExploreGraph },
    { name: 'Repositories', href: '/dashboard/repos', icon: FolderOutlined }, { name: 'Integrations', href: '/dashboard/integrations', icon: ExtensionOutlined, permission: permissions.canManageIntegrations },
    { name: 'Sync activity', href: '/dashboard/ingestion', icon: SyncOutlined }, { name: 'Settings', href: '/dashboard/settings', icon: SettingsOutlined, permission: permissions.canAccessSettings },
  ].filter(item => item.permission !== false);
  const currentTitle = user?.orgName || 'recalix';

  const chatSidebarWidth = chatCollapsed ? 40 : 260;
  const startNewChat = () => router.push(`/dashboard/chat?new=${crypto.randomUUID()}`);

  const handleRename = async (id: string) => {
    if (!editValue.trim()) { setEditingId(null); return; }
    try {
      await api.patch(`/query/${id}`, { title: editValue.trim() });
      setRecentQueries(prev => prev.map(q => q._id === id ? { ...q, title: editValue.trim() } : q));
    } catch {}
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/query/${id}`);
      setRecentQueries(prev => prev.filter(q => q._id !== id));
    } catch {}
    setMenuAnchor(null);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* MAIN SIDEBAR */}
      <Box component="aside" sx={{ width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)', position: 'fixed', inset: '16px auto 16px 16px', zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width var(--duration-slow) var(--ease-glass)', bgcolor: 'var(--color-bg-elevated)', backdropFilter: 'blur(var(--glass-blur))', border: '1px solid var(--color-border-glass)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-elevation-2)' }}>
        <Box sx={{ height: 76, px: collapsed ? 0 : 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && <Link href="/dashboard" style={{ textDecoration: 'none' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}><Box sx={{ width: 30, height: 30, display: 'grid', placeItems: 'center', bgcolor: 'var(--color-primary)', borderRadius: 2 }}><SparklesOutlined sx={{ fontSize: 18, color: '#fff' }} /></Box><Typography sx={{ color: 'var(--color-text-primary)', fontSize: 18, fontWeight: 700, letterSpacing: '-.05em' }}>recalix</Typography></Box></Link>}
          <IconButton size="small" onClick={() => setCollapsed(!collapsed)} sx={{ color: 'var(--color-text-tertiary)' }}>{collapsed ? <ChevronRightOutlined /> : <ChevronLeftOutlined />}</IconButton>
        </Box>
        {!collapsed && <Box sx={{ mx: 'var(--space-3)', mb: 'var(--space-4)', p: 'var(--space-3)', borderRadius: 'var(--radius-md)', bgcolor: 'var(--color-primary-subtle)' }}><Typography sx={{ color: 'var(--color-primary)', fontSize: 12, fontWeight: 700 }}>Your team&rsquo;s shared context</Typography><Typography sx={{ color: 'var(--color-text-secondary)', fontSize: 11, mt: .35 }}>Connected and ready to explore.</Typography></Box>}
        <List sx={{ px: 'var(--space-2)', py: 0, flex: 1 }}>{navItems.map(item => { const Icon = item.icon; const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)); return <Tooltip key={item.href} title={collapsed ? item.name : ''} placement="right"><ListItemButton component={Link} href={item.href} sx={{ mb: .5, minHeight: 44, borderRadius: 'var(--radius-md)', justifyContent: collapsed ? 'center' : 'initial', px: collapsed ? 0 : 'var(--space-3)', color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)', bgcolor: active ? 'var(--color-primary-subtle)' : 'transparent', '&:hover': { bgcolor: active ? 'var(--color-primary-subtle)' : 'rgba(255,255,255,.7)' } }}><ListItemIcon sx={{ minWidth: collapsed ? 0 : 38, color: 'inherit' }}><Icon sx={{ fontSize: 20 }} /></ListItemIcon>{!collapsed && <ListItemText primary={<Typography sx={{ fontSize: 13.5, fontWeight: active ? 700 : 500 }}>{item.name}</Typography>} />}</ListItemButton></Tooltip>; })}</List>
        <Box sx={{ p: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 1.25, justifyContent: collapsed ? 'center' : 'initial' }}><Avatar src={user?.avatarUrl || ''} sx={{ width: 34, height: 34, bgcolor: 'var(--color-primary-subtle)', color: 'var(--color-primary)', fontWeight: 700, fontSize: 13 }}>{user?.name?.[0]?.toUpperCase() || 'U'}</Avatar>{!collapsed && <Box sx={{ minWidth: 0, flex: 1 }}><Typography noWrap sx={{ fontWeight: 700, fontSize: 13 }}>{user?.name || 'User'}</Typography><Typography noWrap sx={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>{user?.orgName || 'Personal workspace'}</Typography></Box>}{!collapsed && <IconButton size="small" onClick={logout} sx={{ color: 'var(--color-text-tertiary)' }}><LogoutOutlined sx={{ fontSize: 18 }} /></IconButton>}</Box>
      </Box>

      {/* CHAT SIDEBAR */}
      {isChatPage && (
        <Box sx={{ position: 'fixed', left: 'calc(var(--sidebar-collapsed) + 32px)', top: '16px', bottom: '16px', width: chatSidebarWidth, zIndex: 40, display: 'flex', flexDirection: 'column', bgcolor: 'var(--color-bg-elevated)', backdropFilter: 'blur(var(--glass-blur))', border: '1px solid var(--color-border-glass)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-elevation-1)', overflow: 'hidden', transition: 'width var(--duration-slow) var(--ease-glass)' }}>
          {!chatCollapsed && (
            <>
              <Box sx={{ px: 'var(--space-3)', py: 'var(--space-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <HistoryOutlined sx={{ fontSize: 18, color: 'var(--color-primary)' }} />
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>History</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <Tooltip title="New chat">
                    <IconButton size="small" onClick={startNewChat} sx={{ color: '#fff', bgcolor: 'var(--color-primary)', width: 28, height: 28, '&:hover': { bgcolor: 'var(--color-primary-dark)' } }}>
                      <AddOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Close sidebar">
                    <IconButton size="small" onClick={() => setChatCollapsed(true)} sx={{ color: 'var(--color-text-tertiary)', width: 28, height: 28 }}>
                      <ChevronLeftOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Divider sx={{ borderColor: 'var(--color-border-subtle)' }} />
              <Box sx={{ flex: 1, overflowY: 'auto', px: 'var(--space-2)', py: 'var(--space-2)' }}>
                {recentQueries.length === 0 && (
                  <Typography sx={{ color: 'var(--color-text-tertiary)', fontSize: 12, px: 'var(--space-2)', py: 'var(--space-4)', textAlign: 'center' }}>
                    No conversations yet
                  </Typography>
                )}
                {recentQueries.map((q: any) => (
                  <Box key={q._id} sx={{ position: 'relative', mb: .5, borderRadius: 'var(--radius-md)', '&:hover .chat-item-actions': { opacity: 1 } }}>
                    <ListItemButton
                      onClick={() => router.push(`/dashboard/chat?q=${q._id}`)}
                      sx={{ borderRadius: 'var(--radius-md)', px: 'var(--space-2)', py: 'var(--space-1)', pr: '48px' }}
                    >
                      {editingId === q._id ? (
                        <TextField
                          size="small"
                          variant="standard"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => handleRename(q._id)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRename(q._id); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                          sx={{ '& .MuiInputBase-input': { fontSize: 12, py: 0 } }}
                        />
                      ) : (
                        <ListItemText
                          slotProps={{ primary: { component: 'div' }, secondary: { component: 'div' } }}
                          primary={<Typography sx={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title || q.question}</Typography>}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap', mt: '2px' }}>
                              <Typography variant="caption" sx={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{new Date(q.createdAt).toLocaleDateString()}</Typography>
                              {q.repoIds && q.repoIds.length > 0 && (
                                <Chip
                                  icon={<FolderCopyOutlined sx={{ fontSize: 9 }} />}
                                  label={`${q.repoIds.length} repo${q.repoIds.length > 1 ? 's' : ''}`}
                                  size="small"
                                  sx={{ height: 16, fontSize: '8px', borderRadius: 'var(--radius-sm)', '& .MuiChip-icon': { ml: '2px', mr: '-2px' } }}
                                />
                              )}
                            </Box>
                          }
                        />
                      )}
                    </ListItemButton>
                    <Box className="chat-item-actions" sx={{ position: 'absolute', right: 'var(--space-1)', top: '50%', transform: 'translateY(-50%)', opacity: 0, transition: 'opacity var(--duration-fast) var(--ease-out)', display: 'flex', gap: '2px' }}>
                      <IconButton size="small" onClick={e => { e.stopPropagation(); setEditingId(q._id); setEditValue(q.title || q.question); }} sx={{ width: 22, height: 22, color: 'var(--color-text-tertiary)' }}>
                        <EditOutlined sx={{ fontSize: 13 }} />
                      </IconButton>
                      <IconButton size="small" onClick={e => { e.stopPropagation(); setMenuAnchor({ id: q._id, el: e.currentTarget }); }} sx={{ width: 22, height: 22, color: 'var(--color-text-tertiary)' }}>
                        <MoreHorizOutlined sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                    <Menu
                      anchorEl={menuAnchor?.el}
                      open={menuAnchor?.id === q._id}
                      onClose={() => setMenuAnchor(null)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      slotProps={{ paper: { sx: { minWidth: 120 } } }}
                    >
                      <MenuItem onClick={() => { setEditingId(q._id); setEditValue(q.title || q.question); setMenuAnchor(null); }} dense>
                        <EditOutlined sx={{ fontSize: 14, mr: 'var(--space-2)' }} /> Rename
                      </MenuItem>
                      <MenuItem onClick={() => handleDelete(q._id)} dense sx={{ color: 'var(--color-error)' }}>
                        <DeleteOutlined sx={{ fontSize: 14, mr: 'var(--space-2)' }} /> Delete
                      </MenuItem>
                    </Menu>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ borderColor: 'var(--color-border-subtle)' }} />
              <Box sx={{ px: 'var(--space-3)', py: 'var(--space-2)' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 12, color: 'var(--color-text-secondary)', mb: 'var(--space-2)' }}>Integrated tools</Typography>
                <ListItemButton component={Link} href="/dashboard/integrations" sx={{ borderRadius: 'var(--radius-md)', px: 'var(--space-2)', py: 'var(--space-1)', '&:hover': { bgcolor: 'var(--color-primary-subtle)' } }}>
                  <SourceOutlined sx={{ fontSize: 16, color: 'var(--color-text-secondary)', mr: 'var(--space-2)' }} />
                  <ListItemText primary={<Typography sx={{ fontSize: 12 }}>GitHub</Typography>} />
                </ListItemButton>
              </Box>
            </>
          )}

        </Box>
      )}

      {/* Chat sidebar toggle overlay */}
      {isChatPage && chatCollapsed && (
        <Box sx={{ allignment: `center`,position: 'fixed', left: `calc(var(--sidebar-collapsed) + 32px)`, top: '29px', zIndex: 45 }}>
          <Tooltip title="Show history sidebar">
            <IconButton onClick={() => setChatCollapsed(false)} sx={{ width: 28, height: 48, borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', bgcolor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-glass)', borderLeft: 'none', color: 'var(--color-text-tertiary)', '&:hover': { bgcolor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' } }}>
              <ChevronRightOutlined sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* MAIN CONTENT */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', ml: isChatPage ? `calc(var(--sidebar-collapsed) + 32px + 32px + ${chatSidebarWidth}px)` : collapsed ? 'calc(var(--sidebar-collapsed) + 32px)' : 'calc(var(--sidebar-width) + 32px)', mr: 2, transition: 'margin var(--duration-slow) var(--ease-glass)' }}>
        {!isChatPage && (
          <Box component="header" sx={{ height: 'var(--topbar-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 'var(--space-5)' }}>
            <Box><Typography sx={{ fontWeight: 700, fontSize: 19, letterSpacing: '-.03em' }}>{currentTitle}</Typography><Typography sx={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>Organization workspace</Typography></Box>
            <Tooltip title="Start a new conversation"><IconButton onClick={startNewChat} sx={{ color: '#fff', bgcolor: 'var(--color-primary)', width: 38, height: 38, '&:hover': { bgcolor: 'var(--color-primary-hover)' } }}><AddOutlined /></IconButton></Tooltip>
          </Box>
        )}
        <Box component="main" sx={{ display: 'flex', flexDirection: 'column', pb: isChatPage ? 0 : 'var(--space-6)', flex: 1, minHeight: 0 }}>{children}</Box>
      </Box>
    </Box>
  );
}
