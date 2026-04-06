import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM",
  description: "관리자 CRM 내부 페이지",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/crm",
  },
};

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
