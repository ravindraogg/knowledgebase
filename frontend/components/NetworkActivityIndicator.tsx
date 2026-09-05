'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export function NetworkActivityIndicator() {
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    const updateActivity = (event: Event) => {
      setActiveRequests((event as CustomEvent<number>).detail || 0);
    };

    window.addEventListener('recalix:network-activity', updateActivity);
    return () => window.removeEventListener('recalix:network-activity', updateActivity);
  }, []);

  if (activeRequests === 0) return null;

  return (
    <Box sx={{ position: 'fixed', top: 'var(--space-3)', right: 'var(--space-3)', zIndex: 2000, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', px: 'var(--space-3)', py: 'var(--space-2)', borderRadius: 'var(--radius-full)', bgcolor: 'rgba(32, 35, 51, 0.9)', color: '#fff', boxShadow: 'var(--shadow-elevation-3)', backdropFilter: 'blur(12px)', pointerEvents: 'none' }}>
      <CircularProgress size={14} thickness={5} sx={{ color: '#fff' }} />
      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Loading{activeRequests > 1 ? ` (${activeRequests})` : ''}…</Typography>
    </Box>
  );
}
