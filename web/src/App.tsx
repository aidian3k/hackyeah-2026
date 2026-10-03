import { useEffect, useRef } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PanelLayout } from "@/components/layout/PanelLayout";
import { FindPage } from "@/pages/FindPage";
import { IdeaPage } from "@/pages/IdeaPage";
import { KnowledgePage } from "@/pages/KnowledgePage";
import { LibraryPage } from "@/pages/LibraryPage";
import { LoginPage } from "@/pages/LoginPage";
import { MyReportsPage } from "@/pages/MyReportsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { SolutionPage } from "@/pages/SolutionPage";
import { InboxPage } from "@/pages/panel/InboxPage";
import { ReportPage } from "@/pages/panel/ReportPage";
import { ReportsPage } from "@/pages/panel/ReportsPage";
import { SolutionReviewPage } from "@/pages/panel/SolutionReviewPage";
import { SolutionsQueuePage } from "@/pages/panel/SolutionsQueuePage";
import { TrendsPage } from "@/pages/panel/TrendsPage";
import { useAuth, type Role, roleHome } from "@/lib/auth";

/**
 * Po zmianie ścieżki (nie przy pierwszym renderze) przenosi fokus na h1 nowej strony,
 * żeby czytnik ekranu przeczytał jej nazwę, i przewija nawigację do aktywnej pozycji.
 * Działa ponad oboma układami, więc obejmuje też przejście serwis ↔ panel.
 */
function useRouteFocus(): void {
  const { pathname } = useLocation();
  const previous = useRef(pathname);

  useEffect(() => {
    const active = document.querySelector<HTMLElement>('.ds-nav [aria-current="page"]');
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });

    if (previous.current === pathname) return;
    previous.current = pathname;
    const target =
      document.querySelector<HTMLElement>("#main h1") ?? document.querySelector<HTMLElement>("#main");
    target?.focus();
  }, [pathname]);
}

function RequireRole({ requiredRole }: { requiredRole: Role }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== requiredRole) return <Navigate to={roleHome(session.role)} replace />;
  return <Outlet />;
}

export function App() {
  useRouteFocus();
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireRole requiredRole="reporter" />}>
        <Route element={<AppShell />}>
          <Route index element={<FindPage />} />
          <Route path="rozwiazania" element={<LibraryPage />} />
          <Route path="rozwiazania/:id" element={<SolutionPage />} />
          <Route path="wiedza" element={<KnowledgePage />} />
          <Route path="mam-pomysl" element={<IdeaPage />} />
          <Route path="moje-zgloszenia" element={<MyReportsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route element={<RequireRole requiredRole="administrator" />}>
        <Route path="panel" element={<PanelLayout />}>
          <Route index element={<InboxPage />} />
          <Route path="zgloszenia" element={<ReportsPage />} />
          <Route path="zgloszenia/:id" element={<ReportPage />} />
          <Route path="rozwiazania" element={<SolutionsQueuePage />} />
          <Route path="rozwiazania/:id" element={<SolutionReviewPage />} />
          <Route path="trendy" element={<TrendsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
