import { getCachedSiteName } from "@/lib/settings";
import Link from "next/link";

export async function NavbarBrand() {
  const siteName = await getCachedSiteName();
  return (
    <div className="flex items-center gap-2" data-testid="navbar-brand">
      <Link href="/" className="text-xl font-bold tracking-wide">
        {siteName}
      </Link>
      <span className="text-xs uppercase tracking-[0.2em] text-white">
        Beta
      </span>
    </div>
  );
}

export default NavbarBrand;
