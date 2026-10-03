import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="ds-footer">
      <div className="ds-footer__inner">
        <ul className="ds-footer__links">
          <li>
            <Link to="/panel">Panel Hubu</Link>
          </li>
        </ul>
        <p className="ds-footer__note">
          Splot pomaga mieszkańcom i samorządom Małopolski znaleźć sprawdzone rozwiązania problemów
          społecznych. Prowadzi go Małopolski Hub Innowacji Społecznych, Regionalny Ośrodek Polityki
          Społecznej w Krakowie.
        </p>
        <p className="ds-footer__note">Prototyp HackYeah 2026, dane testowe.</p>
      </div>
    </footer>
  );
}
