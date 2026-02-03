/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Acknowledge Turbopack for next dev (webpack config is for next build --webpack only)
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Stub optional deps that are not used in browser (MetaMask SDK, WalletConnect/pino)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    }
    return config
  },
}

export default nextConfig
