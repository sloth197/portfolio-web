import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "관리자 인증 페이지",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/admin/login",
  },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
