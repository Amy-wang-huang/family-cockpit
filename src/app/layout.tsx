import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "家庭驾驶舱",
  description: "中国家庭的记忆与关爱操作系统",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
