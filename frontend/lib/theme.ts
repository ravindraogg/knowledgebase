import { createTheme } from '@mui/material/styles';
export const getMuiTheme = () => createTheme({
  palette: { mode: 'light', primary: { main: '#5b5bd6' }, secondary: { main: '#3987a7' }, background: { default: '#f6f8fc', paper: 'rgba(255,255,255,.72)' }, text: { primary: '#202333', secondary: '#62697d' } },
  typography: { fontFamily: 'var(--font-sans)', h1: { fontWeight: 700, letterSpacing: '-.045em' }, h2: { fontWeight: 700, letterSpacing: '-.035em' }, h3: { fontWeight: 700, letterSpacing: '-.025em' }, button: { textTransform: 'none', fontWeight: 600 } },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 'var(--radius-md)', boxShadow: 'none' }, contained: { backgroundColor: 'var(--color-primary)', '&:hover': { backgroundColor: 'var(--color-primary-hover)', boxShadow: 'none' } } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-elevation-2)' } } },
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none', backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-elevation-2)' } } },
    MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { backgroundColor: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', '& fieldset': { borderColor: 'var(--color-border-default)' }, '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' } } } } }
  }
});
