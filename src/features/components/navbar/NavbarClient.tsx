import { NavbarBrand, NavbarPrimaryActions, NavbarSearch } from "./index";

export function NavbarClient() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-primary text-white shadow-sm"
      data-testid="navbar-shell"
      role="banner"
    >
      <div className="mx-auto flex w-full max-w-8xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <NavbarBrand />

        <NavbarSearch />
        <div
          className="flex w-full flex-1 items-center gap-4 md:justify-end"
          data-testid="navbar-interactions"
          role="navigation"
          aria-label="User actions"
        >
          <NavbarPrimaryActions />
        </div>
      </div>
    </header>
  );
}

export default NavbarClient;
