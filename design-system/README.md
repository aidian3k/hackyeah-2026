# design-system

Tokeny i style komponentów HubMI. Zasady użycia: [`/DESIGN.md`](../DESIGN.md).

Szybki start w czystym HTML:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&display=swap">
<link rel="stylesheet" href="design-system/tokens.css">
<link rel="stylesheet" href="design-system/components.css">
```

W projekcie z bundlerem (Vite, Next.js) zaimportuj oba pliki CSS w globalnym arkuszu stylów. Przy Tailwindzie dodaj `presets: [require('./design-system/tailwind.preset.js')]`.

Podgląd komponentów: `design-system/examples/index.html`.
