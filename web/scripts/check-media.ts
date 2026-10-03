/// <reference types="node" />
// Ręczny skrypt sprawdzający rozpoznawanie filmów YouTube w korpusie (nie test).
//   npx tsx web/scripts/check-media.ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { firstVideo, youtubeId } from "../src/lib/media.ts";
import { plural } from "../src/lib/format.ts";
import type { MediaItem } from "../src/api/types.ts";

const CORPUS = join(dirname(fileURLToPath(import.meta.url)), "../../data/solutions/rops-biblioteka.json");
const records = JSON.parse(readFileSync(CORPUS, "utf-8")) as { title?: string; media?: MediaItem[] }[];

let videos = 0;
let recognized = 0;
const failed: string[] = [];
for (const r of records) {
  for (const m of r.media ?? []) {
    if (m.type !== "video") continue;
    videos += 1;
    if (youtubeId(m.url)) recognized += 1;
    else failed.push(m.url);
  }
}
const withVideo = records.filter((r) => firstVideo(r.media ?? [])).length;

console.log(`Elementy type="video": ${videos}`);
console.log(`Rozpoznane youtubeId: ${recognized}`);
console.log(`Rekordy z filmem (firstVideo): ${withVideo}`);
if (failed.length) console.log(`Nierozpoznane:\n  ${failed.join("\n  ")}`);

const samples = [
  "https://www.youtube.com/watch?v=ev173g-d_vA&t=5s",
  "http://www.youtube.com/watch?v=BK6a8fjELR0&t=48s",
  "https://youtu.be/JfmyToWVuOs",
  "https://www.youtube.com/embed/QgkpdYndqNU",
  "https://vimeo.com/123456",
  "nie-adres",
];
for (const s of samples) console.log(`  ${s} → ${youtubeId(s)}`);

console.log("plural:", [1, 2, 5, 12, 22].map((n) => `${n} ${plural(n, "osoba", "osoby", "osób")}`).join(", "));
