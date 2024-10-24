/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production"

const nextConfig = {
  images: {
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config, { webpack }) => {
    // Enable the topLevelAwait experimental feature
    config.experiments = { layers: true, topLevelAwait: true }

    return config
  },
  compiler: {
    // - removes the console.log from production build
    removeConsole: isProd,
  },
  // - dev indicator for build activity in development environment
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: "bottom-right",
  },
  // - allows production builds even if project has ESLint errors
  eslint: {
    // + toggle this to `true` if your deadline is tomorrow 😂
    ignoreDuringBuilds: false,
  },
  // - dangerously allow production builds even if project has type errors
  typescript: {
    // + toggle this to `true` if your boss is nearby during build 😂
    ignoreBuildErrors: false,
  },
  /**
   * React's Strict Mode is a development mode only feature for
   * highlighting potential problems in an application. It helps
   * to identify unsafe lifecycles, legacy API usage, and a
   * number of other features.
   */
  reactStrictMode: true,
}

module.exports = nextConfig
