import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pranshu-ai.vercel.app"),
  title: "Pranshu's AI — Production Vector Database & Advanced RAG Engine",
  description: "High-performance vector database with HNSW, KD-Tree, Groq LLaMA 3.3 inference, and 2026 Advanced RAG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F6F3] text-[#111315] antialiased selection:bg-cobalt-500/15 selection:text-cobalt-800">
        {children}
      </body>
    </html>
  );
}
