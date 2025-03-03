/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },

  // Add the rewrites configuration here
  async rewrites() {
    // Use ENV variable to determine if we're in docker or local development
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_HOST || "http://backend:3001";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
