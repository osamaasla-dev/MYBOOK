import Link from "next/link";
import { Home } from "lucide-react";

export function NavbarHomeLink() {
  return (
    <Link
      href="/"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-dark transition hover:bg-accent-light"
      aria-label="Home"
      data-testid="navbar-home-link"
    >
      <Home className="h-5 w-5" aria-hidden="true" />
    </Link>
  );
}

export default NavbarHomeLink;
