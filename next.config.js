/** @type {import('next').NextConfig} */
const nextConfig = {
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
