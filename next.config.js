/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export static HTML for Electron
  output: 'export',
  distDir: '.next',
  outputFileTracingRoot: __dirname,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
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