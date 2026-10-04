/**
 * Tailwind dla frontendu HubMI. Motyw pochodzi wyłącznie z presetu design systemu
 * (kolory = zmienne z tokens.css, więc data-contrast="high" działa bez osobnych klas).
 * Preflight wyłączony: reset i style bazowe daje design-system/components.css,
 * a Tailwind dokłada tylko klasy narzędziowe — wygląd istniejących ekranów się nie zmienia.
 */
module.exports = {
  presets: [require("../design-system/tailwind.preset.js")],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  corePlugins: { preflight: false },
};
