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
};

export default nextConfig;
