import Image from "next/image";
import Link from "next/link";
import { focusRing } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { brandAssets } from "@/presentation/config/brand";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const mark = brandAssets.mark("cream");
const wordmark = brandAssets.wordmarkFlat("cream");

/** Header logo: the cream mark plus the flat wordmark (the wordmark hides on narrow phones). */
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
        priority
        className="hidden h-auto w-[5.5rem] min-[400px]:block"
      />
    </Link>
  );
}
