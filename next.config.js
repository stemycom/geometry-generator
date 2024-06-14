/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // deployed with Dockerfile
  async rewrites() {
    return [
      {
        source: "/:path*.svg",
        destination: "/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
