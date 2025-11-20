import { NavbarBrand, NavbarPrimaryActions, NavbarSearch } from "./index";

export function NavbarClient() {
  return (
    <header
      className="bg-[var(--color-primary)] text-[var(--color-white)] shadow-sm"
      data-testid="navbar-shell"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <NavbarBrand />

        <div
          className="flex w-full flex-1 items-center gap-4 md:justify-end"
          data-testid="navbar-interactions"
        >
          <NavbarSearch />
          <NavbarPrimaryActions />
        </div>
      </div>
    </header>
  );
}

export default NavbarClient;
