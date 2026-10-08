# Data sources roadmap

Principle: connect to the **original** holders of genealogical records through official APIs, bulk
downloads, or public-domain collections. Never scrape a site whose terms forbid it. Every hit
keeps its source, license and attribution (see `supabase/functions/_shared/records-connectors.ts`).

| Record category | Original source | Access | License | Status |
|---|---|---|---|---|
| Notable people, places | Wikidata | Public API | CC0 | **Implemented** |
| US newspapers 1777–1963 | Library of Congress – Chronicling America | Public JSON API | Public domain | **Implemented** |
| Books, local histories, directories | Internet Archive | Public search API | Per item | **Implemented** |
| US libraries/archives/museums | DPLA | Free API key (`DPLA_API_KEY`) | Per item | **Implemented** (needs key) |
| European archives/libraries | Europeana | Free API key (`EUROPEANA_API_KEY`) | Per item | **Implemented** (needs key) |
| Family trees | WikiTree | Public API + CC BY-SA data dumps | CC BY-SA | Planned |
| Family trees & records | FamilySearch | Official API; developer key + OAuth; their terms apply | Their terms | Planned (needs your developer registration) |
| US Census 1790–1950 | NARA / Census Bureau; IPUMS (free microdata) | Bulk + 1950census.archives.gov | Public domain | Planned |
| Immigration / passenger lists | NARA; Statue of Liberty–Ellis Island Foundation | Catalog API / free search | Public domain / their terms | Planned |
| Military records | NARA catalog; NPS Civil War Soldiers & Sailors | Catalog API / bulk | Public domain | Planned |
| Land records | BLM General Land Office Records | Public search | Public domain | Planned |
| Newspapers (other countries) | Trove (AU), Papers Past (NZ), Delpher (NL), Gallica (FR) | Public APIs (some need keys) | Varies | Planned |
| Vital records (birth/marriage/death) | State and national archives | Varies; many offer bulk or FOIA | Varies | Planned per jurisdiction |
| Ancestry composition (DNA) | 1000 Genomes, HGDP (open reference panels) | Bulk download | Open | Planned |
| Cemetery records | Contributions + licensed partners | Find a Grave / BillionGraves forbid scraping | – | Not scraped |

## Rules for every connector
1. Official API or bulk file first; read and follow the terms of use.
2. Send a descriptive `User-Agent` with a contact address (`CONTACT_EMAIL`).
3. Time-box and isolate each source so one outage never breaks a search.
4. Store license + attribution with each result; show it in the UI.
5. Living people: never publish personal data about living individuals found in records.
