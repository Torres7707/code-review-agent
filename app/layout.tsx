import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// DESIGN.md: Inter for human text; code and data use the ui-monospace stack.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Code Review Agent",
  description:
    "Sign in with GitHub, pick a pull request, and get severity-graded review cards tied to the exact diff lines.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
