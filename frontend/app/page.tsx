'use client';

import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Container,
  Typography,
  Stack,
  Fade,
  Slide,
} from '@mui/material';
import {
  ArrowForwardOutlined,
  AccountTreeOutlined,
  HubOutlined,
  SendOutlined,
  AutoGraphOutlined,
  DescriptionOutlined,
  CommitOutlined,
  ChatBubbleOutlineOutlined,
  ShieldOutlined,
  CloudOutlined,
  SpeedOutlined,
  KeyboardArrowDownOutlined,
} from '@mui/icons-material';

const prompts = [
  'Why was the authentication flow changed?',
  'Summarize recent work on payments',
  'Who owns the database service?',
  'What broke in the last release?',
];

const features = [
  {
    title: 'Grounded answers',
    copy: 'Every answer is connected to real commits, tickets, and source material — not guesses.',
    icon: AccountTreeOutlined,
  },
  {
    title: 'One shared memory',
    copy: 'Bring repositories, Jira tickets, and Slack conversations into a single living graph.',
    icon: HubOutlined,
  },
  {
    title: 'Made for flow',
    copy: 'Stay in the conversation instead of switching between ten different tools.',
    icon: AutoGraphOutlined,
  },
];

const values = [
  {
    title: 'DPDP Compliant',
    copy: 'Built for India-first deployment with encryption-at-rest and audit trails.',
    icon: ShieldOutlined,
  },
  {
    title: 'On-Prem / BYOC',
    copy: 'Run entirely in your infrastructure. No data leaves your cloud.',
    icon: CloudOutlined,
  },
  {
    title: 'Built for Legacy Code',
    copy: 'Designed for messy, undocumented codebases — the reality of Indian IT.',
    icon: SpeedOutlined,
  },
];

export default function LandingPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: `
          linear-gradient(180deg, #F8F7FF 0%, #F0EEFF 25%, #E8E4F8 50%, #F4F2FF 75%, #FAF9FF 100%)
        `,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 50% at 20% 30%, rgba(129, 140, 248, 0.12), transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(56, 189, 248, 0.08), transparent 50%),
            radial-gradient(ellipse 70% 60% at 50% 80%, rgba(139, 92, 246, 0.06), transparent 50%)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      {/* Floating orbs for depth */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '40%',
          right: '8%',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '20%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
          filter: 'blur(45px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ─── FIXED NAVBAR ─── */}
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
            backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(129, 140, 248, 0.15)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.04)',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              height: { xs: 68, md: 76 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '12px',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                }}
              >
                <AutoGraphOutlined sx={{ color: '#fff', fontSize: 20 }} />
              </Box>
              <Typography
                sx={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: '#111827',
                  fontFamily: "'Inter', -apple-system, sans-serif",
                }}
              >
                recalix
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button
                component={Link}
                href="/login"
                sx={{
                  color: '#4B5563',
                  fontWeight: 500,
                  fontSize: 14,
                  textTransform: 'none',
                  px: 2,
                  borderRadius: '10px',
                  '&:hover': { background: 'rgba(99,102,241,0.06)' },
                }}
              >
                Sign in
              </Button>
              <Button
                component={Link}
                href="/register"
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                  fontWeight: 600,
                  fontSize: 14,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                Create workspace
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container
        maxWidth="lg"
        sx={{ position: 'relative', zIndex: 1, pt: { xs: '68px', md: '76px' } }}
      >
        {/* ─── HERO SECTION ─── */}
        <Box sx={{ pt: { xs: 6, md: 10 }, textAlign: 'center', position: 'relative' }}>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: 40, sm: 52, md: 72 },
              lineHeight: 1.05,
              maxWidth: 820,
              mx: 'auto',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#111827',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            Your team&apos;s context,
            <br />
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #0EA5E9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ready for a conversation.
            </Box>
          </Typography>

          <Typography
            sx={{
              maxWidth: 580,
              mx: 'auto',
              mt: 4,
              color: '#4B5563',
              fontSize: { xs: 16, md: 18.5 },
              lineHeight: 1.7,
              fontWeight: 400,
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            recalix turns commits, tickets, and discussions into clear answers
            with the source material behind every response. No more guessing why
            code exists.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              mt: 5,
              flexWrap: 'wrap',
            }}
          >
            <Button
              component={Link}
              href="/register"
              variant="contained"
              endIcon={<ArrowForwardOutlined />}
              size="large"
              sx={{
                background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                fontWeight: 600,
                fontSize: 15,
                textTransform: 'none',
                px: 4,
                py: 1.5,
                borderRadius: '14px',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                  boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              Start for free
            </Button>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(0,0,0,0.08)',
                color: '#111827',
                fontWeight: 600,
                fontSize: 15,
                textTransform: 'none',
                px: 4,
                py: 1.5,
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.85)',
                  borderColor: 'rgba(99,102,241,0.25)',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.1)',
                },
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              Explore your workspace
            </Button>
          </Box>

          {/* Scroll indicator */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 6,
              animation: 'bounce 2s ease-in-out infinite',
              '@keyframes bounce': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(8px)' },
              },
            }}
          >
            <KeyboardArrowDownOutlined
              sx={{ color: 'rgba(99,102,241,0.4)', fontSize: 28 }}
            />
          </Box>
        </Box>

        {/* ─── DEMO CARD ─── */}
        <Box
          sx={{
            maxWidth: 860,
            mx: 'auto',
            mt: { xs: 8, md: 12 },
            overflow: 'hidden',
            textAlign: 'left',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.06),
              0 2px 8px rgba(0, 0, 0, 0.04),
              inset 0 1px 0 rgba(255, 255, 255, 0.6)
            `,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background: 'url("/noise.svg") repeat',
              opacity: 0.025,
              pointerEvents: 'none',
            },
          }}
        >
          {/* Window chrome */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: '1px solid rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              background: 'rgba(255,255,255,0.5)',
            }}
          >
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#E8B4B6',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              />
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#F1D4A5',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              />
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#B9DEC9',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              />
            </Box>
            <Typography
              sx={{
                ml: 1,
                color: '#9CA3AF',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              Ask recalix
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2.5, md: 4 } }}>
            {/* Chat message */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  mt: 0.25,
                  width: 34,
                  height: 34,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                }}
              >
                <AutoGraphOutlined sx={{ fontSize: 18 }} />
              </Box>
              <Box
                sx={{
                  maxWidth: 540,
                  p: 2.5,
                  borderRadius: '6px 20px 20px 20px',
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(99,102,241,0.1)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14.5,
                    lineHeight: 1.65,
                    color: '#1F2937',
                    fontWeight: 400,
                  }}
                >
                  The authentication refresh was introduced to prevent interrupted
                  sessions during the mobile handoff. The decision is linked to
                  ENG-482 and the March 12 release.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={
                      <DescriptionOutlined
                        sx={{ fontSize: 14, color: '#6366F1' }}
                      />
                    }
                    label="ENG-482"
                    size="small"
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(99,102,241,0.08)',
                      color: '#6366F1',
                      border: '1px solid rgba(99,102,241,0.12)',
                      '& .MuiChip-icon': { ml: 0.5 },
                    }}
                  />
                  <Chip
                    icon={
                      <CommitOutlined
                        sx={{ fontSize: 14, color: '#0EA5E9' }}
                      />
                    }
                    label="a3f8d2e"
                    size="small"
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(14,165,233,0.08)',
                      color: '#0EA5E9',
                      border: '1px solid rgba(14,165,233,0.12)',
                      '& .MuiChip-icon': { ml: 0.5 },
                    }}
                  />
                  <Chip
                    icon={
                      <HubOutlined
                        sx={{ fontSize: 14, color: '#8B5CF6' }}
                      />
                    }
                    label="3 sources"
                    size="small"
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(139,92,246,0.08)',
                      color: '#8B5CF6',
                      border: '1px solid rgba(139,92,246,0.12)',
                      '& .MuiChip-icon': { ml: 0.5 },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Input bar */}
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                mt: 3,
                p: 1.5,
                pl: 3,
                border: '1px solid rgba(0,0,0,0.06)',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <Typography
                sx={{
                  flex: 1,
                  color: '#9CA3AF',
                  fontSize: 14,
                  py: 0.5,
                  fontWeight: 400,
                }}
              >
                Ask anything about your codebase...
              </Typography>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '12px',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 16px rgba(99, 102, 241, 0.35)',
                  },
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <SendOutlined sx={{ fontSize: 18 }} />
              </Box>
            </Box>

            {/* Prompt suggestions */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mt: 2.5,
                flexWrap: 'wrap',
                pl: 5.5,
              }}
            >
              {prompts.map((prompt) => (
                <Chip
                  key={prompt}
                  label={prompt}
                  size="small"
                  sx={{
                    fontSize: 12,
                    fontWeight: 500,
                    background: 'rgba(255,255,255,0.6)',
                    color: '#6B7280',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '10px',
                    height: 32,
                    cursor: 'pointer',
                    '&:hover': {
                      background: 'rgba(99,102,241,0.06)',
                      borderColor: 'rgba(99,102,241,0.15)',
                      color: '#6366F1',
                    },
                    transition: 'all 0.15s ease',
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* ─── FEATURE CARDS ─── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            mt: 6,
          }}
        >
          {features.map(({ title, copy, icon: Icon }) => (
            <Box
              key={title}
              sx={{
                p: 4,
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: `
                  0 4px 20px rgba(0, 0, 0, 0.05),
                  0 1px 3px rgba(0, 0, 0, 0.03),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6)
                `,
                cursor: 'default',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  background: 'rgba(255, 255, 255, 0.85)',
                  boxShadow: `
                    0 12px 40px rgba(0, 0, 0, 0.08),
                    0 4px 12px rgba(0, 0, 0, 0.04),
                    inset 0 1px 0 rgba(255, 255, 255, 0.8)
                  `,
                },
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background:
                    'linear-gradient(90deg, #6366F1, #818CF8, #0EA5E9)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover::after': { opacity: 1 },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '14px',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(99,102,241,0.08)',
                  mb: 2.5,
                }}
              >
                <Icon
                  sx={{
                    color: '#6366F1',
                    fontSize: 22,
                  }}
                />
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#111827',
                  letterSpacing: '-0.01em',
                  mb: 1,
                }}
              >
                {title}
              </Typography>
              <Typography
                sx={{
                  color: '#6B7280',
                  fontSize: 14,
                  lineHeight: 1.65,
                  fontWeight: 400,
                }}
              >
                {copy}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* ─── VALUE PROPS SECTION ─── */}
        <Box sx={{ mt: { xs: 10, md: 16 }, textAlign: 'center' }}>
          <Chip
            label="Built for modern engineering teams"
            sx={{
              mb: 3,
              height: 32,
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.1)',
              color: '#6366F1',
              fontWeight: 600,
              fontSize: 12,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: 28, md: 40 },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#111827',
              maxWidth: 600,
              mx: 'auto',
              mb: 2,
            }}
          >
            Designed for the way you actually work
          </Typography>
          <Typography
            sx={{
              maxWidth: 520,
              mx: 'auto',
              color: '#6B7280',
              fontSize: 16,
              lineHeight: 1.7,
              mb: 6,
            }}
          >
            India-first, on-prem ready, and built for the messy reality of
            legacy codebases.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {values.map(({ title, copy, icon: Icon }) => (
              <Box
                key={title}
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                  textAlign: 'center',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    background: 'rgba(255, 255, 255, 0.75)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'rgba(99,102,241,0.06)',
                    mx: 'auto',
                    mb: 2.5,
                  }}
                >
                  <Icon sx={{ color: '#6366F1', fontSize: 24 }} />
                </Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: '#111827',
                    mb: 1,
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  sx={{
                    color: '#6B7280',
                    fontSize: 14,
                    lineHeight: 1.65,
                  }}
                >
                  {copy}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ─── CTA SECTION ─── */}
        <Box
          sx={{
            mt: { xs: 10, md: 16 },
            mb: 8,
            p: { xs: 4, md: 6 },
            borderRadius: '24px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.6)
            `,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative gradient behind */}
          <Box
            sx={{
              position: 'absolute',
              top: '-50%',
              left: '-20%',
              width: '140%',
              height: '200%',
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: 26, md: 36 },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#111827',
                mb: 2,
              }}
            >
              Start understanding your codebase today
            </Typography>
            <Typography
              sx={{
                maxWidth: 480,
                mx: 'auto',
                color: '#6B7280',
                fontSize: 16,
                lineHeight: 1.7,
                mb: 4,
              }}
            >
              Join teams that never wonder why code exists again. Free for
              individuals, powerful for organizations.
            </Typography>
            <Button
              component={Link}
              href="/register"
              variant="contained"
              endIcon={<ArrowForwardOutlined />}
              size="large"
              sx={{
                background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                fontWeight: 600,
                fontSize: 15,
                textTransform: 'none',
                px: 5,
                py: 1.5,
                borderRadius: '14px',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                  boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              Create your workspace
            </Button>
          </Box>
        </Box>

        {/* ─── FOOTER ─── */}
        <Box
          sx={{
            py: 4,
            borderTop: '1px solid rgba(0,0,0,0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
              }}
            >
              <AutoGraphOutlined sx={{ color: '#fff', fontSize: 15 }} />
            </Box>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '-0.02em',
              }}
            >
              recalix
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: '#9CA3AF' }}>
            &copy; 2026 Recalix. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}