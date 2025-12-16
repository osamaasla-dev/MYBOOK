import { NavbarBrand, NavbarPrimaryActions, NavbarSearch } from "./index";

export function NavbarClient() {
  return (
    <header
      className="bg-primary text-white shadow-sm"
      data-testid="navbar-shell"
    >
      <div className="mx-auto flex w-full max-w-8xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <NavbarBrand />

        <NavbarSearch />
        <div
          className="flex w-full flex-1 items-center gap-4 md:justify-end"
          data-testid="navbar-interactions"
        >
          <NavbarPrimaryActions />
        </div>
      </div>
    </header>
  );
}

export default NavbarClient;
