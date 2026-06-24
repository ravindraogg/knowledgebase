/** @type {import('next').NextConfig} */
const API_PORT = process.env.API_PORT || 4000

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Proxy all /api/* calls to the standalone Express backend so the frontend
  // can keep making same-origin requests.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://localhost:${API_PORT}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
