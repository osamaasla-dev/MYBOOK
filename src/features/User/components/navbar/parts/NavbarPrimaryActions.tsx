import { NavbarHomeLink, NavbarProfileLink } from "../index";

export function NavbarPrimaryActions() {
  return (
    <nav
      className="flex items-center gap-3"
      aria-label="Primary"
      data-testid="navbar-primary-actions"
    >
      <NavbarHomeLink />
      <NavbarProfileLink />
    </nav>
  );
}

export default NavbarPrimaryActions;
