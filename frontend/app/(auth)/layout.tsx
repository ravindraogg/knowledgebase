import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoGraphOutlined, CheckCircleOutlined } from '@mui/icons-material';

export const metadata: Metadata = { title: 'Recalix — Secure workspace access', description: 'Sign in or create your Recalix software intelligence workspace.' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="auth-shell">
    <section className="auth-visual">
      <div className="auth-visual-overlay" />
      <Link href="/" className="auth-brand"><span><AutoGraphOutlined fontSize="small" /></span>recalix</Link>
      <div className="auth-visual-copy"><p className="auth-eyebrow">ENGINEERING INTELLIGENCE</p><h1>Every decision.<br />Finally connected.</h1><p>Give your team a living, searchable memory of the work that shapes your product.</p><ul><li><CheckCircleOutlined /> Grounded in your source of truth</li><li><CheckCircleOutlined /> Built for secure engineering teams</li></ul></div>
      <div className="auth-visual-note">Private by design · Your data stays yours</div>
    </section>
    <section className="auth-content">{children}</section>
  </main>;
}
