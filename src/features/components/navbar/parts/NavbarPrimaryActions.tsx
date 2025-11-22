import { NavbarHomeLink } from "./NavbarHomeLink";
import { NavbarProfileLink } from "./NavbarProfileLink";
import { NavbarNotifications } from "./NavbarNotifications";

export function NavbarPrimaryActions() {
  return (
    <nav
      className="flex items-center gap-3"
      aria-label="Primary"
      data-testid="navbar-primary-actions"
    >
      <NavbarHomeLink />
      <NavbarNotifications />
      <NavbarProfileLink />
    </nav>
  );
}

export default NavbarPrimaryActions;
