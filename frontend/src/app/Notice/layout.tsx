import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notice",
  description: "사이트 공지와 업데이트 내역을 확인할 수 있습니다.",
  alternates: {
    canonical: "/Notice",
  },
  openGraph: {
    title: "Notice | JWS Portfolio",
    description: "사이트 공지와 업데이트 내역을 확인할 수 있습니다.",
    url: "/Notice",
  },
};

export default function NoticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
