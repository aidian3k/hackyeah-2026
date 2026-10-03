import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Banner } from "./Banner";
import { Footer } from "./Footer";
import { MainNav } from "./MainNav";

/** Rama serwisu publicznego: link „Przejdź do treści”, baner, nawigacja, treść, stopka. Treść: `children` albo trasa. */
export function AppShell({ children }: { children?: ReactNode }) {
  return (
    <>
      <a className="ds-skip-link" href="#main">
        Przejdź do treści
      </a>
      <header className="ds-header">
        <Banner />
        <MainNav />
      </header>
      <main id="main" tabIndex={-1}>
        {children ?? <Outlet />}
      </main>
      <Footer />
    </>
  );
}
