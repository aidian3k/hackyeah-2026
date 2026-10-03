import { useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/RequireRole";
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

export function App() {
  useRouteFocus();
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<FindPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="rozwiazania" element={<LibraryPage />} />
        <Route path="rozwiazania/:id" element={<SolutionPage />} />
        <Route path="wiedza" element={<KnowledgePage />} />
        <Route element={<RequireRole requiredRole="reporter" />}>
          <Route path="mam-pomysl" element={<IdeaPage />} />
          <Route path="moje-zgloszenia" element={<MyReportsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="panel" element={<RequireRole requiredRole="administrator" layout="panel" />}>
        <Route index element={<InboxPage />} />
        <Route path="zgloszenia" element={<ReportsPage />} />
        <Route path="zgloszenia/:id" element={<ReportPage />} />
        <Route path="rozwiazania" element={<SolutionsQueuePage />} />
        <Route path="rozwiazania/:id" element={<SolutionReviewPage />} />
        <Route path="trendy" element={<TrendsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
