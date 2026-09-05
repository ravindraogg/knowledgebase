'use client';
import React, { useState } from 'react';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { SearchOutlined, DescriptionOutlined, SourceOutlined } from '@mui/icons-material';

interface Source {
  id: string;
  name: string;
  type: string;
  path: string;
}

export default function QueryPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [latency, setLatency] = useState<number | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer(null);
    setSources([]);
    setLatency(null);

    try {
      const res = await api.post('/query', { question });
      setAnswer(res.data.answer);
      setSources(res.data.sources);
      setLatency(res.data.latencyMs);
    } catch (err) {
      console.error('Error submitting query:', err);
      setAnswer('❌ Sorry, an error occurred while processing your request. Please ensure the backend and Neo4j are running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', py: 'var(--space-4)' }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 'var(--space-2)', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
        Ask Recalix
      </Typography>
      <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 'var(--space-6)', textAlign: 'center' }}>
        Query your codebase knowledge-graph using natural language. Try "why does connectMongoDB exist?"
      </Typography>

      {/* --- Search Bar --- */}
      <form onSubmit={handleSearch} style={{ marginBottom: 'var(--space-6)' }}>
        <Box sx={{ display: 'flex', gap: 'var(--space-3)' }}>
          <TextField
            fullWidth
            placeholder="Ask a question about why code exists..."
            variant="outlined"
            value={question}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: 52,
                fontSize: '15px',
                borderRadius: 'var(--radius-lg)',
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ px: 'var(--space-5)', borderRadius: 'var(--radius-lg)', height: 52 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : <SearchOutlined />}
          </Button>
        </Box>
      </form>

      {/* --- Answer Card --- */}
      {answer && (
        <Card className="glass-panel" sx={{ p: 'var(--space-6)' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 'var(--space-4)' }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                RECALIX RESPONSE
              </Typography>
              {latency && (
                <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)' }}>
                  Latency: {latency}ms
                </Typography>
              )}
            </Box>

            {/* Formatted Text Body */}
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-line',
                fontSize: '15px',
                lineHeight: 1.7,
                mb: 'var(--space-6)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {answer}
            </Typography>

            {/* Sources List */}
            {sources.length > 0 && (
              <Box sx={{ borderTop: '1px solid var(--color-border-glass)', pt: 'var(--space-4)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SourceOutlined sx={{ fontSize: 20 }} /> Sources Mapped
                </Typography>
                <List sx={{ p: 0 }}>
                  {sources.map((source) => (
                    <ListItem
                      key={source.id}
                      className="glass-panel"
                      sx={{
                        backgroundColor: 'var(--color-bg-surface)',
                        mb: 'var(--space-2)',
                        py: 'var(--space-2)',
                        px: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: 'var(--color-primary)' }}>
                        <DescriptionOutlined sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                            {source.name}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                            {`${source.type} in ${source.path}`}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
