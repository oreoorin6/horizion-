/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable API routes by NOT using 'export' output in development mode
  // Keep 'output' commented out to allow API routes to work
  // output: 'standalone', // Only use this in production build
  distDir: 'dist',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
    domains: ['static1.e621.net']
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000', 'localhost:3001', '127.0.0.1:3001']
    }
  }
}

module.exports = nextConfig