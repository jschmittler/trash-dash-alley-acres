import type { Metadata } from "next";
import { headers } from "next/headers";
import { Bungee, Nunito_Sans } from "next/font/google";
import "./globals.css";

const display = Bungee({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const body = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const metadataBase = host
    ? new URL(`${protocol}://${host}`)
    : new URL("https://trash-dash.chatgpt.site");

  return {
    metadataBase,
    title: "Trash Dash: Alley Acres",
    description:
      "Run, rummage, power up, and clean up Alley Acres in a bite-sized raccoon platformer.",
    openGraph: {
      title: "Trash Dash: Alley Acres",
      description: "A woodland-to-junkyard raccoon platformer you can play in your browser.",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Trash Dash: Alley Acres",
      description: "Rummage, glide, and recycle your way across Alley Acres.",
      images: ["/og.png"],
    },
  };
}

const designContract = `
THESIS: The playable pixel world owns the viewport; refuse a game trapped inside generic website chrome.
OWN-WORLD: Sky blue, leaf green, dirt brown, teal recycling metal, orange highlights, dark pixel outlines, chunky action controls.
STORY: Learn to move, turn trash into power, cross from woodland to junkyard, defeat the trash-bag monster, reach the depot.
FIRST VIEWPORT: A full-bleed 16:9 game stage under a compact HUD; title and Start Rummaging sit over the living level.
FORM: Immersive side-scrolling game cabinet, pinned by the supplied 16-bit atlas; seed key brief-pinned-raccoon-world.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>
        <template dangerouslySetInnerHTML={{ __html: `<!-- ${designContract} -->` }} />
        {children}
      </body>
    </html>
  );
}
