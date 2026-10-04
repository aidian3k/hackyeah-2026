# Koszt hostingu HubMI na AWS

Szacunek miesięczny dla regionu `eu-central-1` (Frankfurt), ceny z 4 października 2026.
Dotyczy wdrożenia z [plan.md](plan.md): skrypty `deploy/aws/backend.sh` i `deploy/aws/frontend.sh`.

## Podsumowanie

Stała infrastruktura kosztuje około **23 USD miesięcznie netto** (około 28 USD z 23% VAT). Prawie cały koszt
to maszyna EC2 i jej publiczny adres IP. Frontend w S3 i CloudFront mieści się przy obecnym ruchu w darmowych limitach.

Do tego dochodzą koszty zależne od ruchu: streszczenia LLM w OpenAI i, jeśli zostanie włączony, reranking Cohere
(około **2 USD za 1000 rozmów**). Embeddingi kosztują ułamki centa.

## Architektura, której dotyczy wycena

- **EC2 t3.small** (2 vCPU, 2 GB RAM) z Amazon Linux 2023: PostgreSQL 16 z pgvector i FastAPI w Dockerze na jednej maszynie.
- **Dysk EBS gp3 20 GB** na system, obrazy Dockera i bazę.
- **Elastic IP**, czyli stały publiczny adres IPv4 maszyny.
- **S3**: prywatny bucket z plikami frontendu (około 2 MB).
- **CloudFront**: HTTPS dla strony, ścieżki `/api/*` kierowane do EC2, funkcja do odświeżania podstron.

## Koszt stały (miesięcznie, 730 godzin)

| Usługa | Wyliczenie | USD / mies. |
|---|---|---:|
| EC2 t3.small (on-demand) | 730 h × 0,0240 USD | 17,52 |
| EBS gp3, 20 GB | 20 GB × 0,0952 USD | 1,90 |
| Publiczny IPv4 (Elastic IP) | 730 h × 0,005 USD | 3,65 |
| S3 (frontend, około 2 MB) | przechowywanie i odczyty przez CloudFront | < 0,01 |
| CloudFront | w darmowym limicie: 1 TB, 10 mln żądań, 2 mln wywołań funkcji | 0,00 |
| Transfer EC2 → CloudFront | transfer do CloudFront jest bezpłatny | 0,00 |
| **Razem netto** | | **≈ 23,07** |

Z 23% VAT (konto bez numeru VAT UE): około 28,38 USD.

## Koszt zależny od ruchu

Każda rozmowa w module „Znajdź rozwiązanie” to jedno wyszukiwanie: embedding zapytania, reranking i streszczenie LLM.

| Pozycja | Cena / założenie | 1000 rozmów |
|---|---|---:|
| Cohere rerank-v3.5 | 2,00 USD za 1000 wyszukiwań (do 100 dokumentów każde) | 2,00 USD |
| Embedding zapytania (OpenAI text-embedding-3-large) | 0,13 USD za 1 mln tokenów; około 60 tokenów na zapytanie | ≈ 0,01 USD |
| Streszczenie LLM (OpenAI gpt-6-luna) | około 3000 tokenów wejścia i do 400 wyjścia (`LLM_MAX_TOKENS`) | wg cennika OpenAI |

Obecne wdrożenie ma reranking wyłączony (`/healthz` zwraca `rerank_provider: noop`), więc pozycja Cohere wynosi teraz 0 USD.

**Wzór na LLM:** liczba rozmów × (3000 × cena wejścia + 400 × cena wyjścia) / 1 000 000.
Ceny `gpt-6-luna` nie ma w tej wycenie; trzeba ją wziąć z aktualnego cennika OpenAI.

**Jednorazowy ingest bazy wiedzy:** około 380 KB tekstu, czyli mniej więcej 150 tys. tokenów: około 0,02 USD za embeddingi.
Moduł 3 (asystent) i Moduł 4 (raport AI) zużywają LLM tylko na żądanie użytkownika.

## Scenariusze miesięczne (bez LLM)

| Scenariusz | Składniki | USD / mies. |
|---|---|---:|
| Sama infrastruktura (demo, mały ruch) | koszt stały | ≈ 23 |
| 1000 rozmów w miesiącu, z Cohere | koszt stały + Cohere + embeddingi | ≈ 25 |
| 10 000 rozmów w miesiącu, z Cohere | koszt stały + Cohere + embeddingi | ≈ 43 |
| Większa maszyna t3.medium (4 GB RAM) | 35,04 + 1,90 + 3,65 | ≈ 41 |
| t3.small włączona tylko 10 h × 22 dni | 5,28 + 1,90 + 3,65 (IP i dysk płatne także po zatrzymaniu) | ≈ 11 |

## Jak obniżyć koszt

- **Wyłączanie poza godzinami pracy.** Zatrzymana instancja nie kosztuje za EC2, ale dysk i Elastic IP nadal są płatne.
- **Reranking bez Cohere.** `RERANK_PROVIDER=noop` usuwa 2 USD na 1000 rozmów, ale wyniki wyszukiwania są wtedy słabsze.
- **Savings Plan na rok.** Obniża cenę EC2 o około 30–40%. Ma sens dopiero po hackathonie, przy stałym użyciu.
- **Usuwanie zasobów po demo.** `deploy/aws/frontend.sh destroy` i `deploy/aws/backend.sh destroy` kasują wszystko, więc dalszych opłat już nie ma.

## Założenia i ryzyka

- Ceny on-demand netto w USD, bez darmowego okresu i kredytów dla nowych kont AWS (mogą obniżyć rachunek do zera w pierwszych miesiącach).
- T3 działa domyślnie w trybie unlimited. Gdy procesor długo pracuje powyżej 20% (np. przy masowym ingeście),
  AWS dolicza 0,05 USD za każdą vCPU-godzinę ponad limit kredytów.
- Kopie zapasowe (snapshoty EBS), monitoring CloudWatch i własna domena nie są uwzględnione.
- Ruch wychodzący z EC2 do internetu (SSH, wywołania API OpenAI i Cohere) mieści się w darmowych 100 GB miesięcznie.

## Źródła cen

- [EC2 t3.small w eu-central-1: 0,0240 USD/h](https://aws-pricing.com/t3.small.html)
- [EBS gp3 w eu-central-1: 0,0952 USD za GB-miesiąc](https://aws-pricing.com/eu-central-1.html)
- [Opłata za publiczny IPv4: 0,005 USD/h (AWS News Blog)](https://aws.amazon.com/blogs/aws/new-aws-public-ipv4-address-charge-public-ip-insights)
- [CloudFront: darmowy limit 1 TB i 10 mln żądań miesięcznie](https://aws.amazon.com/cloudfront/pricing/pay-as-you-go)
- [OpenAI text-embedding-3-large: 0,13 USD za 1 mln tokenów](https://pricepertoken.com/embedding/model/openai-text-embedding-3-large)
- [Cohere Rerank 3.5: 2,00 USD za 1000 wyszukiwań](https://costbench.com/software/llm-api-providers/cohere-api/)
