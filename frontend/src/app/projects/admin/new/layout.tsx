import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Project",
  description: "관리자 프로젝트 생성 페이지",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/projects/admin/new",
  },
};

export default function ProjectCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
