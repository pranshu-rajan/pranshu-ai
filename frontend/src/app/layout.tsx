import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pranshu-ai.vercel.app"),
  title: "Pranshu's AI — Vector Database & Advanced RAG Engine",
  description: "High-performance vector database with HNSW, KD-Tree, Groq LLM inference, and Advanced RAG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFBFD] text-slate-800 antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
