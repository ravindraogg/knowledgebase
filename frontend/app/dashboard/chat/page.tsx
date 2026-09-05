'use client';
import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Select,
  MenuItem,
  OutlinedInput,
  Popover,
} from '@mui/material';
import {
  SendOutlined,
  SmartToyOutlined,
  DescriptionOutlined,
  AccountTreeOutlined,
  ContentCopyOutlined,
  SourceOutlined,
  FilterListOutlined,
} from '@mui/icons-material';
import type { Repository } from '@/types';

interface Source {
  id: string;
  name: string;
  type: string;
  path: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  query?: string;
  sources?: Source[];
  latencyMs?: number;
  reasoningAvailable?: boolean;
  timestamp: Date;
}

const suggestedQueries = [
  'Why does this authentication module exist?',
  'What changed in the last 5 commits?',
  'Who last modified the database service?',
  'What tickets relate to the payment flow?',
];

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <Box component="code" key={index} sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.9em', px: '4px', py: '1px', borderRadius: '4px', bgcolor: 'rgba(91, 91, 214, 0.1)', overflowWrap: 'anywhere' }}>{part.slice(1, -1)}</Box>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Box component="strong" key={index} sx={{ fontWeight: 700 }}>{part.slice(2, -2)}</Box>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function ChatResponse({ content }: { content: string }) {
  const blocks = content.split(/```([\w+-]*)\n?([\s\S]*?)```/g);

  return (
    <Box sx={{ display: 'grid', gap: 'var(--space-3)' }}>
      {blocks.map((block, index) => {
        if (index % 3 === 1) return null;
        if (index % 3 === 2) {
          const language = blocks[index - 1] || 'code';
          return (
            <Box key={index} sx={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', bgcolor: '#202333', overflow: 'hidden', maxWidth: '100%' }}>
              <Typography component="div" sx={{ px: 'var(--space-3)', py: '6px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,.65)', borderBottom: '1px solid rgba(255,255,255,.12)' }}>{language}</Typography>
              <Box component="pre" sx={{ m: 0, p: 'var(--space-3)', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6, color: '#f4f6ff', whiteSpace: 'pre', '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,.3)' } }}>{block.trim()}</Box>
            </Box>
          );
        }

        return block.split('\n').map((line, lineIndex) => {
          const key = `${index}-${lineIndex}`;
          if (!line.trim()) return <Box key={key} sx={{ height: '6px' }} />;
          if (line.startsWith('### ')) return <Typography key={key} component="h3" sx={{ fontSize: '15px', fontWeight: 700, mt: 'var(--space-1)' }}>{renderInlineMarkdown(line.slice(4))}</Typography>;
          if (line.startsWith('## ')) return <Typography key={key} component="h2" sx={{ fontSize: '16px', fontWeight: 700, mt: 'var(--space-1)' }}>{renderInlineMarkdown(line.slice(3))}</Typography>;
          if (/^[-*] /.test(line)) return <Box key={key} component="div" sx={{ display: 'flex', gap: 'var(--space-2)', pl: 'var(--space-1)' }}><Box component="span" sx={{ color: 'var(--color-primary)' }}>•</Box><Box component="span">{renderInlineMarkdown(line.slice(2))}</Box></Box>;
          if (/^\d+\. /.test(line)) return <Typography key={key} component="div">{renderInlineMarkdown(line)}</Typography>;
          return <Typography key={key} component="div">{renderInlineMarkdown(line)}</Typography>;
        });
      })}
    </Box>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryId = searchParams?.get('q');
  const conversationState = searchParams?.toString();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [sourcesAnchor, setSourcesAnchor] = useState<{ id: string; el: HTMLElement } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setMessages([]);
    setSourcesAnchor(null);
    if (queryId) {
      api.get(`/query/${queryId}`).then(r => {
        const data = r.data;
        const msgs: Message[] = [
          { id: `user-${data._id}`, role: 'user', content: data.question, timestamp: new Date(data.createdAt) },
          { id: `assistant-${data._id}`, role: 'assistant', content: data.answer || '', sources: data.sourceNodeIds?.map((id: string) => ({ id, name: id, type: 'source', path: '' })) || [], latencyMs: data.latencyMs, timestamp: new Date(data.createdAt) },
        ];
        setMessages(msgs);
      }).catch(() => {});
    }
  }, [conversationState, queryId]);

  useEffect(() => {
    api.get('/repos').then((r) => setRepos(r.data)).catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (question?: string) => {
    const text = question || input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const repoIds = selectedRepoIds.length > 0 ? selectedRepoIds : [];

      let res;
      if (repoIds.length > 0) {
        res = await api.post('/query/rag', { question: text, repoIds });
        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: res.data.answer || 'I could not find a relevant answer for that query.',
          query: res.data.query,
          sources: res.data.source || [],
          latencyMs: res.data.latencyMs,
          reasoningAvailable: res.data.reasoning?.available,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        res = await api.post('/query', { question: text });
        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: res.data.answer || 'I could not find a relevant answer for that query.',
          sources: res.data.sources || [],
          latencyMs: res.data.latencyMs,
          reasoningAvailable: res.data.reasoning?.available,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.message || err?.message || '';
      const assistantMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${detail || 'Please make sure the backend and Neo4j are running.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '900px',
        width: '100%',
        mx: 'auto',
        flex: 1,
        minHeight: 0,
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          pb: 'var(--space-8)',
          px: 'var(--space-2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Empty State */}
        {messages.length === 0 && (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-6)',
              py: 'var(--space-10)',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--color-primary-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountTreeOutlined sx={{ fontSize: 40, color: 'var(--color-primary)' }} />
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  mb: 'var(--space-2)',
                }}
              >
                Ask Recalix
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'var(--color-text-secondary)',
                  maxWidth: 400,
                  mx: 'auto',
                  lineHeight: 1.6,
                }}
              >
                Start a conversation about your codebase. Ask why code exists, who modified it, or what decisions shaped it.
              </Typography>
            </Box>

            {/* Suggested queries */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center', maxWidth: 600 }}>
              {suggestedQueries.map((query) => (
                <Chip
                  key={query}
                  label={query}
                  variant="outlined"
                  onClick={() => sendMessage(query)}
                  sx={{
                    cursor: 'pointer',
                    borderColor: 'var(--color-border-glass)',
                    color: 'var(--color-text-secondary)',
                    fontSize: '12px',
                    height: 32,
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'var(--color-bg-surface)',
                    transition: 'all var(--duration-fast) var(--ease-out)',
                    '&:hover': {
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-primary)',
                      backgroundColor: 'var(--color-primary-subtle)',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Message Bubbles */}
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              gap: 'var(--space-3)',
              mb: 'var(--space-5)',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
            }}
          >
            {/* Avatar */}
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '13px',
                fontWeight: 600,
                flexShrink: 0,
                mt: 'var(--space-1)',
                ...(msg.role === 'user'
                  ? {
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-text-inverse)',
                    }
                  : {
                      backgroundColor: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary)',
                    }),
              }}
            >
              {msg.role === 'user' ? user?.name?.charAt(0)?.toUpperCase() || 'U' : <SmartToyOutlined sx={{ fontSize: 18 }} />}
            </Avatar>

            {/* Message Content */}
            <Box
              sx={{
                maxWidth: '90%',
                minWidth: 0,
              }}
            >
              {/* Name + Time */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  mb: 'var(--space-1)',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '12px' }}>
                  {msg.role === 'user' ? user?.name || 'You' : 'Recalix'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                {msg.latencyMs && (
                  <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}>
                    {msg.latencyMs}ms
                  </Typography>
                )}
              </Box>

              {/* Bubble */}
              <Box
                sx={{
                  ...(msg.role === 'user'
                    ? {
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-text-inverse)',
                        borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)',
                      }
                    : {
                        backgroundColor: 'var(--color-bg-elevated)',
                        backdropFilter: 'blur(var(--glass-blur))',
                        border: '1px solid var(--color-border-glass)',
                        color: 'var(--color-text-primary)',
                        borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                      }),
                  p: 'var(--space-4)',
                  boxShadow: 'var(--shadow-elevation-1)',
                  position: 'relative',
                }}
              >
                <Box sx={{ lineHeight: 1.7, fontSize: '14px', fontFamily: 'var(--font-sans)', pr: msg.role === 'assistant' ? 'var(--space-5)' : 0 }}>
                  {msg.reasoningAvailable === false && <Chip label="AI reasoning unavailable — showing retrieved evidence only" size="small" color="warning" sx={{ mb: 'var(--space-3)', fontSize: 10, fontWeight: 700 }} />}
                  {msg.role === 'assistant' ? <ChatResponse content={msg.content} /> : msg.content}
                </Box>

                {/* Copy button for assistant messages */}
                {msg.role === 'assistant' && (
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(msg.content)}
                    sx={{
                      position: 'absolute',
                      top: 'var(--space-2)',
                      right: 'var(--space-2)',
                      opacity: 0.5,
                      color: 'var(--color-text-tertiary)',
                      '&:hover': { opacity: 1, color: 'var(--color-primary)' },
                    }}
                    aria-label="Copy response"
                  >
                    <ContentCopyOutlined sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>

              {/* Sources — hidden behind clickable chip */}
              {msg.sources && msg.sources.length > 0 && (
                <>
                  <Chip
                    size="small"
                    icon={<SourceOutlined sx={{ fontSize: 13 }} />}
                    label={`${msg.sources.length} source${msg.sources.length > 1 ? 's' : ''}`}
                    onClick={(e) => setSourcesAnchor(sourcesAnchor?.id === msg.id ? null : { id: msg.id, el: e.currentTarget })}
                    sx={{
                      mt: 'var(--space-2)',
                      height: 24,
                      fontSize: '11px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      border: '1px solid var(--color-border-glass)',
                      backgroundColor: sourcesAnchor?.id === msg.id ? 'var(--color-primary-subtle)' : 'var(--color-bg-surface)',
                      '&:hover': { backgroundColor: 'var(--color-primary-subtle)' },
                    }}
                  />
                  <Popover
                    open={sourcesAnchor?.id === msg.id}
                    anchorEl={sourcesAnchor?.el}
                    onClose={() => setSourcesAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    slotProps={{
                      paper: {
                        sx: {
                          maxHeight: 300,
                          width: 380,
                          p: 'var(--space-2)',
                          border: '1px solid var(--color-border-glass)',
                          boxShadow: 'var(--shadow-elevation-3)',
                        },
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      {msg.sources.map((source) => (
                        <Card
                          key={source.id}
                          sx={{
                            backgroundColor: 'var(--color-bg-surface)',
                            border: '1px solid var(--color-border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: 'none',
                          }}
                        >
                          <CardContent sx={{ p: 'var(--space-1) var(--space-2)', '&:last-child': { pb: 'var(--space-1)' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                              {source.type === 'commit' ? (
                                <AccountTreeOutlined sx={{ fontSize: 13, color: '#EF4444', flexShrink: 0 }} />
                              ) : (
                                <DescriptionOutlined sx={{ fontSize: 13, color: 'var(--color-primary)', flexShrink: 0 }} />
                              )}
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {source.type === 'commit'
                                    ? (source as any).message?.split('\n')[0]?.substring(0, 50) || source.name
                                    : source.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)', fontSize: '9px', display: 'block' }}>
                                  {source.type === 'commit'
                                    ? `by ${(source as any).author || 'unknown'}`
                                    : `${source.type}${source.path ? ` · ${source.path}` : ''}`}
                                </Typography>
                                {(source as any).signature && (
                                  <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)', fontSize: '9px', fontFamily: 'monospace', mt: '1px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {(source as any).signature}
                                  </Typography>
                                )}
                              </Box>
                              <Chip
                                label={source.type}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '8px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontWeight: 600,
                                  flexShrink: 0,
                                  backgroundColor: source.type === 'commit' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                                  color: source.type === 'commit' ? '#EF4444' : 'var(--color-primary)',
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Popover>
                </>
              )}
            </Box>
          </Box>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              gap: 'var(--space-3)',
              mb: 'var(--space-5)',
              alignItems: 'flex-start',
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                flexShrink: 0,
                mt: 'var(--space-1)',
              }}
            >
              <SmartToyOutlined sx={{ fontSize: 18 }} />
            </Avatar>
            <Box
              sx={{
                backgroundColor: 'var(--color-bg-elevated)',
                backdropFilter: 'blur(var(--glass-blur))',
                border: '1px solid var(--color-border-glass)',
                borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                px: 'var(--space-5)',
                py: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: '4px',
                  '& span': {
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-text-tertiary)',
                    animation: 'dotBounce 1.4s infinite ease-in-out both',
                  },
                  '& span:nth-of-type(1)': { animationDelay: '0s' },
                  '& span:nth-of-type(2)': { animationDelay: '0.2s' },
                  '& span:nth-of-type(3)': { animationDelay: '0.4s' },
                  '@keyframes dotBounce': {
                    '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
                    '40%': { transform: 'scale(1)', opacity: 1 },
                  },
                }}
              >
                <span />
                <span />
                <span />
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)', ml: 'var(--space-1)' }}>
                {selectedRepoIds.length > 0 ? 'Analyzing repo context...' : 'Searching knowledge graph...'}
              </Typography>
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Bar — pinned to bottom */}
      <Box
        sx={{
          flexShrink: 0,
          pt: 0,
          pb: 0,
          backgroundColor: 'var(--color-bg-base)',
        }}
      >
        <Box
          className="glass-panel"
          sx={{
            p: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-elevation-3)',
            border: '1px solid var(--color-border-default)',
          }}
        >
          {/* Repo source selector */}
          {repos.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                pb: 'var(--space-1)',
                mb: 'var(--space-1)',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
            >
              <FilterListOutlined
                sx={{ fontSize: 14, color: 'var(--color-text-tertiary)', flexShrink: 0 }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--color-text-tertiary)',
                  fontWeight: 600,
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Sources:
              </Typography>
              <Select
                multiple
                displayEmpty
                size="small"
                value={selectedRepoIds}
                onChange={(e) => setSelectedRepoIds(e.target.value as string[])}
                input={<OutlinedInput notched={false} sx={{ py: 0 }} />}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return (
                      <Typography variant="caption" sx={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                        All repositories
                      </Typography>
                    );
                  }
                  return (
                    <Box sx={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'nowrap', overflow: 'hidden' }}>
                      {selected.map((val) => {
                        const repo = repos.find((r) => r._id === val);
                        if (!repo) return null;
                        return (
                          <Chip
                            key={val}
                            label={repo.name}
                            size="small"
                            onDelete={() => setSelectedRepoIds((prev) => prev.filter((r) => r !== val))}
                            onMouseDown={(e) => e.stopPropagation()}
                            sx={{ height: 22, fontSize: '11px', borderRadius: 'var(--radius-sm)', maxWidth: 140 }}
                          />
                        );
                      })}
                    </Box>
                  );
                }}
                MenuProps={{
                  anchorOrigin: { vertical: 'top', horizontal: 'left' },
                  transformOrigin: { vertical: 'bottom', horizontal: 'left' },
                  slotProps: {
                    paper: {
                      sx: { maxHeight: 240 },
                    },
                  },
                }}
                sx={{
                  flexGrow: 1,
                  '& .MuiSelect-select': {
                    py: '2px !important',
                    display: 'flex',
                    alignItems: 'center',
                  },
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              >
                {repos.map((repo) => (
                  <MenuItem key={repo._id} value={repo._id} sx={{ py: 'var(--space-1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', width: '100%' }}>
                      <Typography variant="body2" sx={{ fontSize: '13px', flexGrow: 1 }}>{repo.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 'var(--space-2)',
            }}
          >
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            minRows={1}
            maxRows={6}
            placeholder="Ask about your codebase..."
            variant="standard"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            slotProps={{
              input: {
                disableUnderline: true,
                sx: {
                  fontSize: '15px',
                  fontFamily: 'var(--font-sans)',
                  px: 'var(--space-2)',
                  py: 'var(--space-1)',
                  lineHeight: 1.6,
                },
              },
            }}
          />
          <IconButton
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            sx={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: input.trim()
                ? 'var(--color-primary)'
                : 'var(--color-bg-surface)',
              color: input.trim() ? 'var(--color-text-inverse)' : 'var(--color-text-tertiary)',
              transition: 'all var(--duration-fast) var(--ease-out)',
              flexShrink: 0,
              mb: 'var(--space-1)',
              '&:hover': {
                transform: input.trim() ? 'scale(1.05)' : 'none',
              },
              '&.Mui-disabled': {
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-tertiary)',
              },
            }}
            aria-label="Send message"
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : <SendOutlined sx={{ fontSize: 20 }} />}
          </IconButton>
          </Box>
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 'var(--space-1)',
            mb: 'var(--space-1)',
            mx: 'auto',
            color: 'var(--color-text-tertiary)',
            fontSize: '10px',
          }}
        >
          Recalix answers are sourced from your knowledge graph. Always verify critical decisions.
        </Typography>
      </Box>
    </Box>
  );
}
