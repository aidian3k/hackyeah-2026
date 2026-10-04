import { useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/RequireRole";
import { ChallengePage } from "@/pages/ChallengePage";
import { FindPage } from "@/pages/FindPage";
import { IdeaPage } from "@/pages/IdeaPage";
import { InnovationTestAccessPage } from "@/pages/InnovationTestAccessPage";
import { InnovationTestPage } from "@/pages/InnovationTestPage";
import { InnovationTestsPage } from "@/pages/InnovationTestsPage";
import { KnowledgePage } from "@/pages/KnowledgePage";
import { LibraryPage } from "@/pages/LibraryPage";
import { AccessibilityPage } from "@/pages/AccessibilityPage";
import { LoginPage } from "@/pages/LoginPage";
import { MaterialsPage } from "@/pages/MaterialsPage";
import { MyReportsPage } from "@/pages/MyReportsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { SolutionPage } from "@/pages/SolutionPage";
import { InboxPage } from "@/pages/panel/InboxPage";
import { KnowledgeBasePage } from "@/pages/panel/KnowledgeBasePage";
import { KnowledgeEditPage } from "@/pages/panel/KnowledgeEditPage";
import { PanelInnovationTestCreatePage } from "@/pages/panel/InnovationTestCreatePage";
import { PanelInnovationTestManagePage } from "@/pages/panel/InnovationTestManagePage";
import { PanelInnovationTestsPage } from "@/pages/panel/InnovationTestsPage";
import { ReportPage } from "@/pages/panel/ReportPage";
import { ReportsPage } from "@/pages/panel/ReportsPage";
import { SolutionReviewPage } from "@/pages/panel/SolutionReviewPage";
import { SolutionsQueuePage } from "@/pages/panel/SolutionsQueuePage";
import { TrendsPage } from "@/pages/panel/TrendsPage";
// Moduł 3: Kreator pomysłów
import { ApplicationPage } from "@/pages/ApplicationPage";
import { CallsPage } from "@/pages/CallsPage";
import { CanvasPage } from "@/pages/CanvasPage";
import { MyIdeasPage } from "@/pages/MyIdeasPage";
import { PanelIdeaReviewPage } from "@/pages/panel/IdeaReviewPage";
import { PanelIdeasPage } from "@/pages/panel/IdeasPage";
// Moduł 5: Platforma komunikacji
import { CommHomePage } from "@/pages/comm/CommHomePage";
import { NewOfferPage } from "@/pages/comm/NewOfferPage";
import { NewThreadPage } from "@/pages/comm/NewThreadPage";
import { OfferPage } from "@/pages/comm/OfferPage";
import { PartnersPage } from "@/pages/comm/PartnersPage";
import { ThreadPage } from "@/pages/comm/ThreadPage";
import { ExpertHomePage } from "@/pages/expert/ExpertHomePage";
import { ExpertThreadPage } from "@/pages/expert/ExpertThreadPage";
import { CommThreadPage } from "@/pages/panel/CommThreadPage";
import { CommThreadsPage } from "@/pages/panel/CommThreadsPage";

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

/** Strona główna z kluczem nawigacji: klik w logo na `/` zaczyna od nowa (czysty czat), a nie zostawia wyników. */
function HomeRoute() {
  const { key } = useLocation();
  return <FindPage key={key} />;
}

export function App() {
  useRouteFocus();
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeRoute />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="dostepnosc" element={<AccessibilityPage />} />
        <Route path="rozwiazania" element={<LibraryPage />} />
        <Route path="rozwiazania/:id" element={<SolutionPage />} />
        <Route path="wiedza" element={<KnowledgePage />} />
        <Route path="wiedza/wyzwania/:code" element={<ChallengePage />} />
        <Route path="wiedza/materialy" element={<MaterialsPage />} />
        <Route path="testy" element={<InnovationTestsPage />} />
        <Route path="testy/dostep/:token" element={<InnovationTestAccessPage />} />
        <Route path="testy/:id" element={<InnovationTestPage />} />
        <Route element={<RequireRole requiredRole="reporter" />}>
          <Route path="mam-pomysl" element={<IdeaPage />} />
          <Route path="moje-zgloszenia" element={<MyReportsPage />} />
          {/* Moduł 3: Kreator pomysłów */}
          <Route path="mam-pomysl/:id" element={<IdeaPage />} />
          <Route path="mam-pomysl/:id/kanwa" element={<CanvasPage />} />
          <Route path="moje-pomysly" element={<MyIdeasPage />} />
          <Route path="wnioski/:id" element={<ApplicationPage />} />
        </Route>
        {/* Moduł 3: lista naborów jest publiczna */}
        <Route path="nabory" element={<CallsPage />} />
        {/* Moduł 5: Platforma komunikacji (rozmowy, tablica partnerstw, konsultacje eksperta) */}
        <Route path="rozmowy" element={<CommHomePage />} />
        <Route path="rozmowy/:id" element={<ThreadPage />} />
        <Route path="partnerzy" element={<PartnersPage />} />
        <Route path="partnerzy/:id" element={<OfferPage />} />
        <Route element={<RequireRole requiredRole="reporter" />}>
          <Route path="rozmowy/nowa" element={<NewThreadPage />} />
          <Route path="partnerzy/nowe" element={<NewOfferPage />} />
        </Route>
        <Route element={<RequireRole requiredRole="mentor" />}>
          <Route path="ekspert" element={<ExpertHomePage />} />
          <Route path="ekspert/rozmowy/:id" element={<ExpertThreadPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="panel" element={<RequireRole requiredRole="administrator" layout="panel" />}>
        <Route index element={<InboxPage />} />
        <Route path="zgloszenia" element={<ReportsPage />} />
        <Route path="zgloszenia/:id" element={<ReportPage />} />
        <Route path="rozwiazania" element={<SolutionsQueuePage />} />
        <Route path="rozwiazania/:id" element={<SolutionReviewPage />} />
        {/* Moduł 6 */}
        <Route path="wiedza" element={<KnowledgeBasePage />} />
        <Route path="wiedza/:id" element={<KnowledgeEditPage />} />
        <Route path="testy" element={<PanelInnovationTestsPage />} />
        <Route path="testy/nowy" element={<PanelInnovationTestCreatePage />} />
        <Route path="testy/:id" element={<PanelInnovationTestManagePage />} />
        <Route path="trendy" element={<TrendsPage />} />
        {/* Moduł 3: Kreator pomysłów */}
        <Route path="pomysly" element={<PanelIdeasPage />} />
        <Route path="pomysly/:id" element={<PanelIdeaReviewPage />} />
        {/* Moduł 5 */}
        <Route path="rozmowy" element={<CommThreadsPage />} />
        <Route path="rozmowy/:id" element={<CommThreadPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
