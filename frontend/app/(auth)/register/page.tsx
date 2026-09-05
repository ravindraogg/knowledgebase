'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  BusinessOutlined,
  PersonOutlined,
  LockOutlined,
  RocketLaunchOutlined,
  ArrowForwardOutlined,
  ArrowBackOutlined,
} from '@mui/icons-material';

const UNSPLASH_BG = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80';

const industries = [
  'Technology / SaaS', 'IT Services / Consulting', 'Financial Services',
  'Healthcare / Biotech', 'E-Commerce / Retail', 'Manufacturing',
  'Education / EdTech', 'Government / Public Sector', 'Other',
];

const companySizes = [
  '1-10 employees', '11-50 employees', '51-200 employees',
  '201-500 employees', '501-1000 employees', '1000+ employees',
];

const repoCountOptions = [
  '1-5 repositories', '6-20 repositories', '21-50 repositories',
  '51-100 repositories', '100+ repositories',
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    orgName: '', website: '', industry: '', companySize: '',
    name: '', email: '', jobTitle: '', phone: '',
    password: '', confirmPassword: '',
    useCases: [] as string[],
    deploymentPreference: 'cloud',
    expectedRepoCount: '',
    agreeTerms: false,
  });

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const toggleUseCase = (val: string) => {
    setForm((prev) => ({
      ...prev,
      useCases: prev.useCases.includes(val)
        ? prev.useCases.filter((u) => u !== val)
        : [...prev.useCases, val],
    }));
  };

  const validateStep = (s: number) => {
    if (s === 1) { if (!form.orgName.trim()) return 'Company name is required.'; }
    if (s === 2) {
      if (!form.name.trim()) return 'Full name is required.';
      if (!form.email.trim()) return 'Work email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email.';
    }
    if (s === 3) {
      if (!form.password) return 'Password is required.';
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreeTerms) { setError('Please agree to the terms and conditions.'); return; }
    setLoading(true);
    setError(null);
    try {
      await register({
        email: form.email, password: form.password, name: form.name, orgName: form.orgName,
        website: form.website || undefined, industry: form.industry || undefined,
        companySize: form.companySize || undefined, jobTitle: form.jobTitle || undefined,
        phone: form.phone || undefined, useCases: form.useCases.length > 0 ? form.useCases : undefined,
        deploymentPreference: form.deploymentPreference || undefined,
        expectedRepoCount: form.expectedRepoCount || undefined,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sectionStyles = { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', mb: 'var(--space-4)' };

  const stepLabels = ['Company', 'Contact', 'Password', 'Preferences'];

  return (
    <Box
      className="bg-unsplash"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        backgroundImage: `url(${UNSPLASH_BG})`,
        p: 'var(--space-4)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 640, position: 'relative', zIndex: 1, animation: 'fadeInUp 0.6s ease-out' }}>
        <Box sx={{ textAlign: 'center', mb: 'var(--space-6)' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800, letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #818CF8, #38BDF8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              mb: 'var(--space-1)', fontSize: '28px',
            }}
          >
            RECALIX
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            Register your company to start building your knowledge graph
          </Typography>
        </Box>

        {/* Step Indicator */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', mb: 'var(--space-6)' }}>
          {stepLabels.map((label, i) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Box
                sx={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: i + 1 <= step ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                  color: i + 1 <= step ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontWeight: 700, fontSize: '13px',
                  transition: 'all var(--duration-normal) var(--ease-out)',
                  border: i + 1 <= step ? 'none' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {i + 1}
              </Box>
              <Typography
                sx={{
                  fontSize: '12px', fontWeight: 600,
                  color: i + 1 <= step ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {label}
              </Typography>
              {i < stepLabels.length - 1 && (
                <Box sx={{ width: 24, height: 1, backgroundColor: i + 1 <= step ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)' }} />
              )}
            </Box>
          ))}
        </Box>

        <Card
          sx={{
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'rgba(22, 27, 34, 0.75)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
            overflow: 'visible',
          }}
        >
          <CardContent sx={{ p: { xs: 'var(--space-5)', md: 'var(--space-8)' } }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{
                  mb: 'var(--space-4)', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.2)', color: '#F87171',
                  '& .MuiAlert-icon': { color: '#F87171' },
                }}>
                  {error}
                </Alert>
              )}

              {step === 1 && (
                <Box>
                  <Box sx={sectionStyles}>
                    <BusinessOutlined sx={{ color: '#818CF8', fontSize: 22 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '17px', color: '#F1F5F9' }}>
                      Company Details
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <TextField label="Company Name" required fullWidth size="small" value={form.orgName}
                      onChange={(e) => handleChange('orgName', e.target.value)} placeholder="e.g. Acme Technologies"
                      sx={textFieldSx} />
                    <TextField label="Company Website" fullWidth size="small" value={form.website}
                      onChange={(e) => handleChange('website', e.target.value)} placeholder="https://acme.com"
                      sx={textFieldSx} />
                    <TextField label="Industry" select fullWidth size="small" value={form.industry}
                      onChange={(e) => handleChange('industry', e.target.value)} sx={textFieldSx}>
                      <MenuItem value="" disabled>Select your industry</MenuItem>
                      {industries.map((ind) => <MenuItem key={ind} value={ind}>{ind}</MenuItem>)}
                    </TextField>
                    <TextField label="Company Size" select fullWidth size="small" value={form.companySize}
                      onChange={(e) => handleChange('companySize', e.target.value)} sx={textFieldSx}>
                      <MenuItem value="" disabled>Select company size</MenuItem>
                      {companySizes.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  </Box>
                </Box>
              )}

              {step === 2 && (
                <Box>
                  <Box sx={sectionStyles}>
                    <PersonOutlined sx={{ color: '#818CF8', fontSize: 22 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '17px', color: '#F1F5F9' }}>
                      Contact Person
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <TextField label="Full Name" required fullWidth size="small" value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)} placeholder="Jane Doe" sx={textFieldSx} />
                    <TextField label="Work Email" required fullWidth size="small" type="email" value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)} placeholder="jane@acme.com" sx={textFieldSx} />
                    <TextField label="Job Title" fullWidth size="small" value={form.jobTitle}
                      onChange={(e) => handleChange('jobTitle', e.target.value)} placeholder="Engineering Manager" sx={textFieldSx} />
                    <TextField label="Phone (optional)" fullWidth size="small" value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)} placeholder="+91 98765 43210" sx={textFieldSx} />
                  </Box>
                </Box>
              )}

              {step === 3 && (
                <Box>
                  <Box sx={sectionStyles}>
                    <LockOutlined sx={{ color: '#818CF8', fontSize: 22 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '17px', color: '#F1F5F9' }}>
                      Account Setup
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <TextField label="Password" required fullWidth size="small" type="password" value={form.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      helperText="Must be at least 8 characters" sx={textFieldSx}
                      slotProps={{ formHelperText: { sx: { color: 'rgba(255,255,255,0.3)' } } }} />
                    <TextField label="Confirm Password" required fullWidth size="small" type="password" value={form.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)} sx={textFieldSx} />
                  </Box>
                </Box>
              )}

              {step === 4 && (
                <Box>
                  <Box sx={sectionStyles}>
                    <RocketLaunchOutlined sx={{ color: '#818CF8', fontSize: 22 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '17px', color: '#F1F5F9' }}>
                      Interest & Preferences
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 600, mb: 'var(--space-2)', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                    What features interest you?
                  </Typography>
                  <FormGroup sx={{ mb: 'var(--space-3)' }}>
                    {[
                      { value: 'github', label: 'GitHub Integration (commits, PRs)' },
                      { value: 'jira', label: 'Jira Integration (tickets)' },
                      { value: 'slack', label: 'Slack Integration (discussions)' },
                      { value: 'legacy_codebase', label: 'Legacy Codebase Analysis' },
                      { value: 'dpdp_compliance', label: 'DPDP Act Compliance' },
                    ].map((uc) => (
                      <FormControlLabel key={uc.value}
                        control={<Checkbox checked={form.useCases.includes(uc.value)}
                          onChange={() => toggleUseCase(uc.value)} size="small"
                          sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#818CF8' } }} />}
                        label={<Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{uc.label}</Typography>} />
                    ))}
                  </FormGroup>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 'var(--space-3)' }} />

                  <FormControl sx={{ mb: 'var(--space-3)' }}>
                    <FormLabel sx={{ fontSize: '13px', fontWeight: 600, mb: 'var(--space-1)', color: 'rgba(255,255,255,0.5)' }}>
                      Deployment Preference
                    </FormLabel>
                    <RadioGroup value={form.deploymentPreference} onChange={(e) => handleChange('deploymentPreference', e.target.value)} row>
                      {[
                        { value: 'cloud', label: 'Cloud (Managed)' },
                        { value: 'on_prem', label: 'On-Premise' },
                        { value: 'byoc', label: 'BYOC' },
                      ].map((opt) => (
                        <FormControlLabel key={opt.value} value={opt.value}
                          control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#818CF8' } }} />}
                          label={<Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{opt.label}</Typography>} />
                      ))}
                    </RadioGroup>
                  </FormControl>

                  <TextField label="Expected Repository Count" select fullWidth size="small"
                    value={form.expectedRepoCount} onChange={(e) => handleChange('expectedRepoCount', e.target.value)}
                    sx={{ ...textFieldSx, mb: 'var(--space-3)' }}>
                    <MenuItem value="" disabled>Select range</MenuItem>
                    {repoCountOptions.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                  </TextField>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 'var(--space-3)' }} />

                  <FormControlLabel
                    control={<Checkbox checked={form.agreeTerms}
                      onChange={(e) => handleChange('agreeTerms', e.target.checked)} size="small"
                      sx={{ '&.Mui-checked': { color: '#818CF8' } }} />}
                    label={<Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                      I agree to the Terms of Service and Privacy Policy
                    </Typography>} />
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'var(--space-6)' }}>
                {step > 1 ? (
                  <Button variant="outlined" onClick={() => { setError(null); setStep((s) => s - 1); }}
                    startIcon={<ArrowBackOutlined />}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                      borderRadius: 'var(--radius-md)',
                      '&:hover': { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' },
                    }}>
                    Back
                  </Button>
                ) : <Box />}

                {step < 4 ? (
                  <Button variant="contained" onClick={handleNext} endIcon={<ArrowForwardOutlined />}
                    sx={{
                      background: 'linear-gradient(135deg, #818CF8, #A78BFA)', color: '#0B0D11',
                      borderRadius: 'var(--radius-md)', px: 'var(--space-5)', fontWeight: 700,
                      '&:hover': { boxShadow: '0 4px 20px rgba(129, 140, 248, 0.3)' },
                    }}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" variant="contained" disabled={loading}
                    endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RocketLaunchOutlined />}
                    sx={{
                      background: 'linear-gradient(135deg, #818CF8, #A78BFA)', color: '#0B0D11',
                      borderRadius: 'var(--radius-md)', px: 'var(--space-6)', fontWeight: 700,
                      '&:hover': { boxShadow: '0 4px 20px rgba(129, 140, 248, 0.3)' },
                    }}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                )}
              </Box>
            </form>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center', mt: 'var(--space-4)' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#818CF8', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
    '&.Mui-focused fieldset': { borderColor: '#818CF8' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)' },
  '& .MuiInputBase-input': { color: '#F1F5F9' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.2)' },
  '& .MuiInputBase-root.MuiOutlinedInput-root': { minHeight: 40 },
};
