// ⚠️ DEMO / PORTFOLIO PROJECT — NOT FOR PRODUCTION USE
// This is not a certified HIPAA-compliant system. See README for details.

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['ws', 'bufferutil', 'utf-8-validate', 'edge-tts-universal'],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cmtuyccedepyrhqssfet.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Suppress noisy but harmless webpack cache serialization warnings.
      // These are triggered by large strings (e.g. from icon libraries) being
      // written to the webpack pack-file cache and do not affect correctness.
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        level: 'error',
      };
    }
    return config;
  },
};

export default nextConfig;
