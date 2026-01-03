import { getCachedSiteName } from "@/lib/settings";
import Link from "next/link";

export async function NavbarBrand() {
  const siteName = await getCachedSiteName();
  return (
    <div className="flex items-center gap-2" data-testid="navbar-brand">
      <Link 
        href="/" 
        className="text-xl font-bold tracking-white hover:opacity-80 transition-opacity"
        aria-label={`${siteName} - Go to homepage`}
      >
        {siteName}
      </Link>
      <span 
        className="text-xs uppercase tracking-[0.2em] text-white"
        aria-hidden="true"
      >
        Beta
      </span>
    </div>
  );
}

export default NavbarBrand;
