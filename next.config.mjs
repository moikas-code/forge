/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

// Use localhost in development to avoid hydration errors
const internalHost = process.env.TAURI_DEV_HOST || 'localhost'

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure Next.js uses the correct assets in development
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
}

export default nextConfig