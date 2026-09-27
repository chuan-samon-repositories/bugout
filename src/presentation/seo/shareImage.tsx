import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/presentation/config/site";
import { SHARE_IMAGE_SIZE } from "./pageMetadata";

/**
 * Theme colours for the share images. ImageResponse cannot read CSS variables, so these mirror the tokens in
 * src/app/globals.css (shareImage.test.ts keeps them equal).
 */
export const shareImageColors = {
  navy: "#243c58",
  "navy-darker": "#0f1c27",
  "navy-deep": "#172938",
  sand: "#eee8ce",
  orange: "#ff780c",
  "orange-on-navy": "#ff8a2b",
} as const;

/**
 * Montserrat for the share images. ImageResponse reads WOFF but not the site's WOFF2, so the two weights it
 * uses are kept as WOFF next to it (same font and licence, src/app/fonts/OFL.txt).
 */
async function loadFonts() {
  const dir = join(process.cwd(), "src/app/fonts");
  const [bold, extraBold] = await Promise.all([
    readFile(join(dir, "montserrat-latin-700-normal.woff")),
    readFile(join(dir, "montserrat-latin-800-normal.woff")),
  ]);
  return [
    { name: "Montserrat", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Montserrat", data: extraBold, weight: 800 as const, style: "normal" as const },
  ];
}

export interface ShareImageContent {
  /** Big orange label, e.g. the kit label "72H". Optional. */
  badge?: string;
  title: string;
  subtitle?: string;
  /** Short text in an orange pill at the top right, e.g. the starting price. */
  highlight?: string;
}

/**
 * Share images are regenerated with the pages that point to them (every 5 minutes at most), so caches must not
 * keep one longer (ImageResponse sends `immutable` for a year by default, which would freeze a changed price).
 */
const CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=86400";

/** A navy share card in the site's style: shop name, optional highlight, badge, title and subtitle. */
export async function renderShareImage({ badge, title, subtitle, highlight }: ShareImageContent): Promise<ImageResponse> {
  const c = shareImageColors;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          backgroundImage: `linear-gradient(135deg, ${c.navy}, ${c["navy-darker"]})`,
          color: c.sand,
          fontFamily: "Montserrat",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 800, letterSpacing: 6, color: c["orange-on-navy"] }}>
            {siteConfig.name.toUpperCase()}
          </div>
          {highlight && (
            <div
              style={{
                display: "flex",
                padding: "12px 28px",
                borderRadius: 999,
                backgroundColor: c.orange,
                color: c["navy-deep"],
                fontSize: 30,
                fontWeight: 800,
              }}
            >
              {highlight}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1 }}>
          {badge && (
            <div style={{ display: "flex", fontSize: 120, fontWeight: 800, lineHeight: 1, color: c.orange }}>{badge}</div>
          )}
          <div style={{ display: "flex", marginTop: badge ? 20 : 0, fontSize: 62, fontWeight: 800, lineHeight: 1.12 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ display: "flex", marginTop: 20, fontSize: 30, fontWeight: 700, lineHeight: 1.35, opacity: 0.85 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    { ...SHARE_IMAGE_SIZE, fonts: await loadFonts(), headers: { "cache-control": CACHE_CONTROL } },
  );
}
