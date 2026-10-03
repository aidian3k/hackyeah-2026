import { CATEGORY_TAG_CLASS } from "@/lib/labels";

interface Props {
  code: string | null;
  label: string | null;
}

/** Etykieta wyzwania: kolor z mapy kategorii, zawsze z nazwą słowną. OTHER i nieznane → neutralny ds-tag. */
export function CategoryTag({ code, label }: Props) {
  if (!code || !label) return null;
  const tone = CATEGORY_TAG_CLASS[code];
  return <span className={tone ? `ds-tag ${tone}` : "ds-tag"}>{label}</span>;
}
