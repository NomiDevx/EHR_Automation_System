// ⚠️ DEMO / PORTFOLIO PROJECT — NOT FOR PRODUCTION USE
// This is not a certified HIPAA-compliant system. See README for details.

/** @type {import('next').NextConfig} */
const nextConfig = {
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
