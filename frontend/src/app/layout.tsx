import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pranshu-ai.vercel.app"),
  title: "Pranshu's AI — Production Vector Database & Advanced RAG",
  description: "High-performance vector database with HNSW, KD-Tree, Groq LLM inference, and Advanced RAG.",
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
