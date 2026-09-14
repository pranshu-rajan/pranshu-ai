import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VectorDB Pro & Advanced RAG Studio",
  description: "Production Vector Database from scratch with HNSW, KD-Tree, and Advanced Hybrid RAG Engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#08090d] text-gray-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
