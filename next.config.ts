import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许手机通过局域网 IP 访问开发服务器（Next 16 默认拦截跨源开发资源）
  allowedDevOrigins: ["192.168.1.5", "http://192.168.1.5:3000"],
};

export default nextConfig;
