import { NavbarHomeLink } from "./NavbarHomeLink";
import { NavbarProfileLink } from "./NavbarProfileLink";
import { Notifications } from "@/features/parts/notifications/components/Notifications";

export function NavbarPrimaryActions() {
  return (
    <nav
      className="flex items-center gap-3"
      aria-label="Primary"
      data-testid="navbar-primary-actions"
    >
      <NavbarHomeLink />
      <Notifications />
      <NavbarProfileLink />
    </nav>
  );
}

export default NavbarPrimaryActions;
