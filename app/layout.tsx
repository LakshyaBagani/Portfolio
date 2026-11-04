import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const onest = localFont({
  // one file: next/font/local can't give each file a unicode-range, so a second (latin-ext) file would
  // override the basic Latin glyphs and break the `ch` unit. The latin subset covers all of the site's text.
  src: [{ path: "./fonts/onest-latin.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-onest",
  display: "swap",
});

const garamond = localFont({
  src: [
    { path: "./fonts/eb-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/eb-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/eb-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/eb-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/eb-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/eb-garamond-latin-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-garamond",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lakshyabagani.com"),
  title: "Lakshya Bagani — Backend, Distributed Systems & Full-Stack Engineer",
  description:
    "Lakshya Bagani builds production data pipelines, distributed systems on Ray and AWS, full-stack products and RL environments for frontier AI labs. Based in Bengaluru, India.",
  authors: [{ name: "Lakshya Bagani" }],
  openGraph: {
    type: "profile",
    title: "Lakshya Bagani — Backend, Distributed Systems & Full-Stack Engineer",
    description: "Production pipelines, distributed systems, full-stack products and RL environments.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EEEAE6",
};

// runs before the first paint: restore dark mode, and ease off the heaviest effects on modest devices
const EARLY = `try{if(localStorage.getItem('lb-mode')==='dark'){document.documentElement.dataset.mode='dark'}}catch(e){}
(function(){var n=navigator,m=n.deviceMemory||8,c=n.hardwareConcurrency||8,s=n.connection&&n.connection.saveData;if(m<=2||c<=2||s)document.documentElement.classList.add('lite');})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${onest.variable} ${garamond.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
