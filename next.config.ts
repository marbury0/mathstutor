import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['localhost:3000', '192.168.1.6:3000', '192.168.1.6', 'localhost']
};

export default nextConfig;
