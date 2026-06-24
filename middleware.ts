import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROLE_PERMISSIONS, type Permission } from '@/lib/rbac'
import type { Role } from '@/lib/types'

// Route-level RBAC seam. The mock shell stores the active role in the `emos_role`
// cookie; a real implementation would validate a session token here instead.
const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: '/app/integrations', permission: 'integrations' },
  { prefix: '/app/settings', permission: 'settings' },
  { prefix: '/app/dashboard', permission: 'dashboard' },
  { prefix: '/app/chat', permission: 'chat' },
  { prefix: '/app/graph', permission: 'graph' },
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const role = request.cookies.get('emos_role')?.value as Role | undefined

  // Unauthenticated users hitting the app must sign in first.
  if (pathname.startsWith('/app')) {
    if (!role) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const rule = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix))
    if (rule && !ROLE_PERMISSIONS[role]?.includes(rule.permission)) {
      // Send to the first page the role is allowed to see.
      const fallback = ROLE_PERMISSIONS[role]?.[0] ?? 'graph'
      const url = request.nextUrl.clone()
      url.pathname = `/app/${fallback}`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*'],
}
