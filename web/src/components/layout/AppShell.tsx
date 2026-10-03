import { Outlet } from "react-router-dom";
import { Banner } from "./Banner";
import { Footer } from "./Footer";
import { MainNav } from "./MainNav";

/** Rama serwisu publicznego: link „Przejdź do treści”, baner, nawigacja, treść, stopka. */
export function AppShell() {
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
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
