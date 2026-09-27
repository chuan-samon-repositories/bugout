import Image from "next/image";
import Link from "next/link";
import { focusRing } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { atWidth, brandAssets } from "@/presentation/config/brand";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

/** Display sizes (w-10 and w-[5.5rem]), so the browser downloads 40/88px files (2x on retina), not the 986px sources. */
const mark = atWidth(brandAssets.mark("cream"), 40);
const wordmark = atWidth(brandAssets.wordmarkFlat("cream"), 88);

/**
 * Header logo: the cream mark plus the flat wordmark. The wordmark hides on narrow phones,
 * so it is not preloaded (only the mark is `priority`) and stays lazy where it is hidden.
 */
export function BrandLogo() {
  return (
    <Link
      href={routes.home}
      aria-label={messages.shell.logoLabel}
      className={cn("flex shrink-0 items-center gap-3 rounded-md", focusRing, "focus-visible:ring-offset-navy-darker")}
    >
      <Image src={mark.src} width={mark.width} height={mark.height} alt="" priority className="h-auto w-10" />
      <Image
        src={wordmark.src}
        width={wordmark.width}
        height={wordmark.height}
        alt=""
        className="hidden h-auto w-[5.5rem] min-[400px]:block"
      />
    </Link>
  );
}
