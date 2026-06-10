import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Magic Maths Tutor",
  description: "A fun, personalized maths tutor for kids.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: `
          if (typeof window !== 'undefined' && window.location.search.includes('test=true')) {
            sessionStorage.setItem('test_mode', 'true');
          }
        `}} />
        {children}
      </body>
    </html>
  );
}
