const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/dashboard/integrations?github_error=' + encodeURIComponent(error) },
    });
  }

  if (!code) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/dashboard/integrations?github_error=no_code' },
    });
  }

  const closeDiv = '<\x2fdiv>';
  const closeScript = '<\x2fscript>';
  const closeBody = '<\x2fbody>';
  const closeHtml = '<\x2fhtml>';

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Connecting GitHub...</title>
  <style>
    body { font-family: 'DM Sans', Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f6f8fc; color: #202333; }
    .card { text-align: center; padding: 40px; background: rgba(255,255,255,0.72); backdrop-filter: blur(18px); border-radius: 18px; box-shadow: 0 12px 36px rgba(57,67,104,0.08); }
    .spinner { width: 32px; height: 32px; border: 3px solid #efefff; border-top-color: #5b5bd6; border-radius: 50%; animation: spin .8s linear infinite; margin: 16px auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { color: #62697d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h3>Connecting GitHub</h3>
    <div class="spinner">${closeDiv}
    <p>Completing authentication, please wait...</p>
  ${closeDiv}
  <script>
    (async function() {
      try {
        const token = localStorage.getItem('recalix_token');
        if (!token) {
          window.location.href = '/login?redirect=/dashboard/integrations&github_error=not_authenticated';
          return;
        }
        const res = await fetch('${API_URL}/auth/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ code: '${code}' }),
        });
        if (res.ok) {
          window.location.href = '/dashboard/integrations?github=connected';
        } else {
          const data = await res.json();
          window.location.href = '/dashboard/integrations?github_error=' + encodeURIComponent(data.message || 'Failed to connect');
        }
      } catch (err) {
        window.location.href = '/dashboard/integrations?github_error=connection_failed';
      }
    })();
  ${closeScript}
${closeBody}
${closeHtml}`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}
