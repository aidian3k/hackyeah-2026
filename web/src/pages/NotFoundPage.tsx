import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Nie znaleziono strony");
  return (
    <div className="ds-page">
      <div className="ds-stack">
        <h1 tabIndex={-1}>Nie znaleźliśmy tej strony</h1>
        <p>Adres może być nieaktualny albo zawierać literówkę.</p>
        <p>
          <Link to="/">Przejdź do wyszukiwania rozwiązań</Link>
        </p>
      </div>
    </div>
  );
}
