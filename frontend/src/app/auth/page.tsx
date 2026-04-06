import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Auth",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthPage() {
  redirect("/about");
}
