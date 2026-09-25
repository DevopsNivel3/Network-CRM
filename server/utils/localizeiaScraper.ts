import { chromium } from "playwright";
import type {
  BrasilApiCnpjResponse,
  LocalizeIaLead,
  LocalizeIaListEntry,
  LocalizeIaScrapeOptions,
  LocalizeIaSearchInput,
} from "../domains/localizeia/localizeia.types";

export type {
  LocalizeIaLead,
  LocalizeIaSearchInput,
} from "../domains/localizeia/localizeia.types";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.184 Safari/537.36",
];

const SEARCH_TIMEOUT_MS = 20000;
const PANEL_TIMEOUT_MS = 8000;
const DETAIL_TIMEOUT_MS = 8000;
const WEBSITE_TIMEOUT_MS = 3500;
const PUBLIC_SEARCH_TIMEOUT_MS = 2500;
const BRASIL_API_CNPJ_TIMEOUT_MS = 3500;
const CNPJ_LOOKUP_BUDGET_MS = 6000;
const ECONODATA_CNPJ_LOOKUP_MS = 45000;
const ENTRY_DETAIL_BUDGET_MS = 12000;
const TOTAL_SCRAPE_BUDGET_MS = 10 * 60 * 1000;
const MAX_SCROLL_STEPS = 80;
const SCROLL_IDLE_LIMIT = 6;
const DETAIL_CONCURRENCY = 5;
const ECONODATA_CONCURRENCY = 1;
const CNPJ_REGEX = /(?:CNPJ\s*:?\s*)?(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i;
const CNPJ_GLOBAL_REGEX =
  /(?:CNPJ\s*:?\s*)?(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\b\d{14}\b)/gi;
const ECONODATA_RESULT_URL_REGEX =
  /(?:https?:\/\/(?:www\.)?econodata\.com\.br)?\/consulta-empresa\/[^\s"'<>]+/gi;
const MAX_CNPJ_CANDIDATES_PER_SOURCE = 8;

import {
  buildEconodataSearchUrl,
  fallbackLeadFromEntry,
  getCompanySearchTerms,
  getComparableTokens,
  isValidCnpjDigits,
  normalizeCnpj,
  normalizeComparableText,
  normalizeWebsiteUrl,
  sanitizeLead,
} from "../domains/localizeia/lead-normalization";
import {
  extractCnpjFromDetailPage,
  extractContactLinkFromDetailPage,
  extractPhoneFromDetailPage,
  extractWebsiteFromDetailPage,
  safeText,
} from "../domains/localizeia/google-maps-detail";

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
) =>
  Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);

const htmlToSearchableText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const fetchText = async (url: string, timeout = WEBSITE_TIMEOUT_MS) => {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENTS[0],
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) return "";

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text") && !contentType.includes("html")) return "";

  return response.text();
};

const brasilApiCnpjCache = new Map<
  string,
  Promise<BrasilApiCnpjResponse | null>
>();

const fetchBrasilApiCnpj = async (rawCnpj?: string | null) => {
  const digits = rawCnpj?.replace(/\D/g, "") || "";
  if (digits.length !== 14) return null;

  if (!brasilApiCnpjCache.has(digits)) {
    brasilApiCnpjCache.set(
      digits,
      fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
        headers: {
          accept: "application/json",
          "user-agent": USER_AGENTS[0],
        },
        signal: AbortSignal.timeout(BRASIL_API_CNPJ_TIMEOUT_MS),
      })
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as BrasilApiCnpjResponse;
        })
        .catch(() => null),
    );
  }

  return brasilApiCnpjCache.get(digits)!;
};

const scoreBrasilApiCnpj = (
  data: BrasilApiCnpjResponse,
  expected?: { city?: string; uf?: string; companyName?: string },
) => {
  let score = 0;

  if (expected?.uf && data.uf) {
    if (data.uf.toUpperCase() !== expected.uf.toUpperCase()) return -1;
    score += 3;
  }

  if (expected?.city && data.municipio) {
    if (
      normalizeComparableText(data.municipio) ===
      normalizeComparableText(expected.city)
    ) {
      score += 5;
    }
  }

  if (expected?.companyName) {
    const expectedTokens = getComparableTokens(expected.companyName);
    const apiTokens = new Set([
      ...getComparableTokens(data.razao_social),
      ...getComparableTokens(data.nome_fantasia),
    ]);
    const matchedTokens = expectedTokens.filter((token) =>
      apiTokens.has(token),
    );

    if (expectedTokens.length && matchedTokens.length) {
      score += Math.min(4, matchedTokens.length);
    }
  }

  return score;
};

const hasEnoughCnpjMatch = (
  score: number,
  expected?: { city?: string; uf?: string; companyName?: string },
) => {
  if (score < 0) return false;
  if (!expected?.city && !expected?.uf && !expected?.companyName) return true;

  return score >= 5;
};

const validateCnpjWithBrasilApi = async (
  rawCnpj?: string | null,
  expected?: { city?: string; uf?: string; companyName?: string },
) => {
  if (!rawCnpj || rawCnpj === "-") return "-";

  const data = await fetchBrasilApiCnpj(rawCnpj);
  if (!data?.cnpj) return "-";

  if (!hasEnoughCnpjMatch(scoreBrasilApiCnpj(data, expected), expected)) {
    return "-";
  }

  return normalizeCnpj(data.cnpj);
};

const findCnpjInText = (text?: string | null) => {
  const match = text?.match(CNPJ_REGEX);
  return normalizeCnpj(match?.[1] || "-");
};

const findCnpjCandidatesInText = (text?: string | null) => {
  const candidates = new Map<string, string>();
  const searchableText = text || "";

  for (const match of searchableText.matchAll(CNPJ_GLOBAL_REGEX)) {
    const normalized = normalizeCnpj(match[1]);
    const digits = normalized.replace(/\D/g, "");
    if (isValidCnpjDigits(digits) && !candidates.has(digits)) {
      candidates.set(digits, normalized);
    }
  }

  return Array.from(candidates.values()).slice(
    0,
    MAX_CNPJ_CANDIDATES_PER_SOURCE,
  );
};

const findEconodataResultUrls = (html?: string | null) => {
  const urls = new Set<string>();
  const source = html || "";

  for (const match of source.matchAll(ECONODATA_RESULT_URL_REGEX)) {
    const rawUrl = match[0].replace(/&amp;/g, "&").replace(/[.,)]$/, "");
    const url = rawUrl.startsWith("http")
      ? rawUrl
      : `https://www.econodata.com.br${rawUrl}`;

    urls.add(url);
  }

  return Array.from(urls).slice(0, 5);
};

const rankEconodataCandidates = (
  candidates: Array<{ cnpj: string; text: string; href: string }>,
  companyName: string,
  searchTerm: string,
  city: string,
  uf: string,
) => {
  const expectedTokens = getComparableTokens(`${companyName} ${searchTerm}`);
  const unique = new Map<string, { cnpj: string; score: number }>();

  for (const candidate of candidates) {
    const cnpj = normalizeCnpj(candidate.cnpj);
    const digits = cnpj.replace(/\D/g, "");
    if (!isValidCnpjDigits(digits)) continue;

    const text = `${candidate.text} ${candidate.href}`;
    const comparableText = normalizeComparableText(text);
    const candidateTokens = new Set(getComparableTokens(text));
    const tokenScore = expectedTokens.filter((token) =>
      candidateTokens.has(token),
    ).length;
    const cityScore = comparableText.includes(normalizeComparableText(city))
      ? 3
      : 0;
    const ufScore = new RegExp(`\\b${uf}\\b`, "i").test(text) ? 1 : 0;
    const score = tokenScore * 3 + cityScore + ufScore;
    const current = unique.get(digits);

    if (!current || score > current.score) {
      unique.set(digits, { cnpj, score });
    }
  }

  return Array.from(unique.values())
    .sort((a, b) => b.score - a.score)
    .map((candidate) => candidate.cnpj)
    .slice(0, MAX_CNPJ_CANDIDATES_PER_SOURCE);
};

const bestBrasilApiCnpjCandidate = async (
  candidates: string[],
  expected?: { city?: string; uf?: string; companyName?: string },
) => {
  let bestCnpj = "-";
  let bestScore = -1;

  for (const candidate of candidates) {
    const data = await fetchBrasilApiCnpj(candidate);
    if (!data?.cnpj) continue;

    const score = scoreBrasilApiCnpj(data, expected);
    if (score > bestScore) {
      bestScore = score;
      bestCnpj = normalizeCnpj(data.cnpj);
    }

    if (score >= 8) return bestCnpj;
  }

  return hasEnoughCnpjMatch(bestScore, expected) ? bestCnpj : "-";
};

const bestEconodataCnpjCandidate = async (
  candidates: string[],
  expected?: { city?: string; uf?: string; companyName?: string },
) => {
  const uniqueCandidates = Array.from(new Set(candidates))
    .map(normalizeCnpj)
    .filter((cnpj) => isValidCnpjDigits(cnpj.replace(/\D/g, "")))
    .slice(0, MAX_CNPJ_CANDIDATES_PER_SOURCE);

  if (!uniqueCandidates.length) return "-";

  const brasilApiCnpj = await bestBrasilApiCnpjCandidate(
    uniqueCandidates,
    expected,
  );
  if (brasilApiCnpj !== "-") return brasilApiCnpj;

  return uniqueCandidates[0];
};

const extractCnpjFromWebsite = async (
  website: string,
  expected?: { city?: string; uf?: string; companyName?: string },
) => {
  const normalizedWebsite = normalizeWebsiteUrl(website);
  if (normalizedWebsite === "-") return "-";

  try {
    const base = new URL(normalizedWebsite);
    const urlsToCheck = [
      base.toString(),
      new URL("/contato", base).toString(),
      new URL("/sobre", base).toString(),
      new URL("/privacidade", base).toString(),
      new URL("/termos", base).toString(),
    ];

    if (normalizedWebsite.startsWith("https://")) {
      urlsToCheck.push(normalizedWebsite.replace(/^https:\/\//, "http://"));
    }

    const pages = await Promise.allSettled(
      Array.from(new Set(urlsToCheck)).map((url) => fetchText(url)),
    );

    const candidates: string[] = [];

    for (const pageResult of pages) {
      if (pageResult.status !== "fulfilled") continue;

      candidates.push(
        ...findCnpjCandidatesInText(htmlToSearchableText(pageResult.value)),
      );
    }

    return bestBrasilApiCnpjCandidate(
      Array.from(new Set(candidates)).slice(0, MAX_CNPJ_CANDIDATES_PER_SOURCE),
      expected,
    );
  } catch {
    return "-";
  }
};

const extractCnpjFromCnpjBiz = async (
  companyName: string,
  city: string,
  uf: string,
) => {
  const searchUrl = `https://cnpj.biz/procura/${encodeURIComponent(
    `${companyName} ${city}`,
  )}`;

  try {
    const searchHtml = await fetchText(searchUrl, PUBLIC_SEARCH_TIMEOUT_MS);
    const searchText = htmlToSearchableText(searchHtml);
    const candidates = findCnpjCandidatesInText(searchText);

    const detailSlugs = Array.from(
      searchHtml.matchAll(/href=["']\/(\d{14})["']/gi),
    )
      .map((match) => match[1])
      .filter(isValidCnpjDigits)
      .slice(0, 4);

    const detailPages = await Promise.allSettled(
      detailSlugs.map((slug) =>
        fetchText(`https://cnpj.biz/${slug}`, PUBLIC_SEARCH_TIMEOUT_MS),
      ),
    );

    for (const detailPage of detailPages) {
      if (detailPage.status !== "fulfilled") continue;
      candidates.push(
        ...findCnpjCandidatesInText(htmlToSearchableText(detailPage.value)),
      );
    }

    return bestBrasilApiCnpjCandidate(
      Array.from(new Set(candidates)).slice(0, MAX_CNPJ_CANDIDATES_PER_SOURCE),
      { city, uf, companyName },
    );
  } catch {
    return "-";
  }
};

const extractCnpjFromEconodata = async (
  companyName: string,
  city: string,
  uf: string,
  address = "",
) => {
  if (!companyName || companyName === "Empresa sem nome") return "-";

  const queries = [
    `site:econodata.com.br/consulta-empresa "${companyName}" "${city}" ${uf}`,
    address
      ? `site:econodata.com.br/consulta-empresa "${companyName}" "${address}"`
      : "",
    `site:econodata.com.br/consulta-empresa "${companyName}" CNPJ`,
  ].filter(Boolean);

  const searchUrls = queries.flatMap((query) => [
    `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
  ]);

  try {
    const searchPages = await Promise.allSettled(
      searchUrls.map((url) => fetchText(url, PUBLIC_SEARCH_TIMEOUT_MS)),
    );
    const candidates: string[] = [];
    const detailUrls: string[] = [];

    for (const searchPage of searchPages) {
      if (searchPage.status !== "fulfilled") continue;

      const html = searchPage.value;
      candidates.push(...findCnpjCandidatesInText(htmlToSearchableText(html)));
      detailUrls.push(...findEconodataResultUrls(html));
    }

    const detailPages = await Promise.allSettled(
      Array.from(new Set(detailUrls))
        .slice(0, 5)
        .map((url) => fetchText(url, PUBLIC_SEARCH_TIMEOUT_MS)),
    );

    for (const detailPage of detailPages) {
      if (detailPage.status !== "fulfilled") continue;
      candidates.push(
        ...findCnpjCandidatesInText(htmlToSearchableText(detailPage.value)),
      );
    }

    return bestEconodataCnpjCandidate(
      Array.from(new Set(candidates)).slice(0, MAX_CNPJ_CANDIDATES_PER_SOURCE),
      { city, uf, companyName },
    );
  } catch {
    return "-";
  }
};

const extractCnpjFromEconodataPage = async (
  context: any,
  companyName: string,
  city: string,
  uf: string,
  address = "",
) => {
  if (!companyName || companyName === "Empresa sem nome") return "-";

  let page;
  try {
    page = await context.newPage();
    page.setDefaultTimeout(PANEL_TIMEOUT_MS);

    const candidates: string[] = [];

    for (const searchTerm of getCompanySearchTerms(companyName)) {
      await page.goto(buildEconodataSearchUrl(searchTerm), {
        waitUntil: "domcontentloaded",
        timeout: DETAIL_TIMEOUT_MS,
      });

      await page
        .waitForLoadState("networkidle", { timeout: DETAIL_TIMEOUT_MS })
        .catch(() => {});
      await page.waitForTimeout(2500);

      const resultHtml = await page.content().catch(() => "");
      const resultLinks: Array<{ text: string; href: string }> = await page
        .evaluate(() =>
          Array.from(document.querySelectorAll("a"))
            .map((link) => ({
              text: link.textContent || "",
              href: link.href || link.getAttribute("href") || "",
            }))
            .filter((link) => link.href.includes("/consulta-empresa/")),
        )
        .catch(() => []);

      const rankedLinkCandidates = rankEconodataCandidates(
        resultLinks.flatMap((link) =>
          findCnpjCandidatesInText(`${link.text} ${link.href}`).map((cnpj) => ({
            cnpj,
            text: link.text,
            href: link.href,
          })),
        ),
        companyName,
        searchTerm,
        city,
        uf,
      );
      const termCandidates = [
        ...rankedLinkCandidates,
        ...findCnpjCandidatesInText(htmlToSearchableText(resultHtml)),
      ];

      const termCnpj = await bestEconodataCnpjCandidate(
        Array.from(new Set(termCandidates)).slice(
          0,
          MAX_CNPJ_CANDIDATES_PER_SOURCE,
        ),
        { city, uf, companyName },
      );
      if (termCnpj !== "-") return termCnpj;

      candidates.push(...termCandidates);
    }

    const cnpj = await bestEconodataCnpjCandidate(
      Array.from(new Set(candidates)).slice(0, MAX_CNPJ_CANDIDATES_PER_SOURCE),
      { city, uf, companyName },
    );

    if (cnpj !== "-") return cnpj;
    return extractCnpjFromEconodata(companyName, city, uf, address);
  } catch {
    return extractCnpjFromEconodata(companyName, city, uf, address);
  } finally {
    if (page) await page.close().catch(() => {});
  }
};

const extractCnpjFromPublicSearch = async (
  companyName: string,
  city: string,
  uf: string,
  address = "",
) => {
  if (!companyName || companyName === "Empresa sem nome") return "-";

  const queries = [
    `"${companyName}" "${city}" ${uf} CNPJ`,
    address ? `"${companyName}" "${address}" CNPJ` : "",
    `"${companyName}" CNPJ`,
  ].filter(Boolean);
  const urls = [
    ...queries.flatMap((query) => [
      `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    ]),
  ];

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const html = await fetchText(url, PUBLIC_SEARCH_TIMEOUT_MS);
      const candidates = findCnpjCandidatesInText(htmlToSearchableText(html));
      if (!candidates.length) return "-";

      return bestBrasilApiCnpjCandidate(candidates, { city, uf, companyName });
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value !== "-") {
      return result.value;
    }
  }

  return "-";
};

const firstKnownCnpj = async (lookups: Array<Promise<string>>) => {
  return new Promise<string>((resolve) => {
    if (!lookups.length) {
      resolve("-");
      return;
    }

    let pending = lookups.length;
    const timer = setTimeout(() => resolve("-"), CNPJ_LOOKUP_BUDGET_MS);

    for (const lookup of lookups) {
      lookup
        .then((cnpj) => {
          if (cnpj !== "-") {
            clearTimeout(timer);
            resolve(cnpj);
          }
        })
        .catch(() => {})
        .finally(() => {
          pending -= 1;
          if (pending <= 0) {
            clearTimeout(timer);
            resolve("-");
          }
        });
    }
  });
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R | null>,
) => {
  const results: Array<R | null> = new Array(items.length).fill(null);
  let index = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (index < items.length) {
        const currentIndex = index++;
        results[currentIndex] = await mapper(items[currentIndex]);
      }
    },
  );

  await Promise.all(workers);
  return results.filter((result): result is R => Boolean(result));
};

const collectListEntriesFromSearchPage = async (
  page: any,
): Promise<LocalizeIaListEntry[]> => {
  return page
    .evaluate(() => {
      const normalizeBrowserPhone = (rawPhone?: string | null) => {
        if (!rawPhone || rawPhone === "-") return "-";
        const onlyDigits = rawPhone.replace(/\D/g, "");
        if (onlyDigits.length === 11) {
          return onlyDigits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        }
        if (onlyDigits.length === 10) {
          return onlyDigits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }
        return rawPhone;
      };

      const normalizeHref = (href?: string | null) => {
        if (!href) return null;
        try {
          return new URL(href, window.location.href).toString();
        } catch {
          return null;
        }
      };

      const entries: any[] = [];
      const seen = new Set<string>();
      const cards = new Set<Element>();

      for (const card of document.querySelectorAll('div[role="article"]')) {
        cards.add(card);
      }

      for (const anchor of document.querySelectorAll(
        'a[href*="/place/"], a[href*="/maps/place/"]',
      )) {
        const card =
          anchor.closest('div[role="article"]') ||
          anchor.closest("[jsaction]") ||
          anchor.parentElement;
        if (card) cards.add(card);
      }

      for (const card of cards) {
        const anchor =
          card.querySelector('a[href*="/place/"]') ||
          card.querySelector('a[href*="/maps/place/"]') ||
          (card.matches('a[href*="/place/"], a[href*="/maps/place/"]')
            ? card
            : null);
        const href = normalizeHref(anchor?.getAttribute("href"));
        if (!href || seen.has(href)) continue;

        seen.add(href);

        const name =
          card.querySelector(".fontHeadlineSmall")?.textContent?.trim() ||
          card.querySelector(".fontHeadlineLarge")?.textContent?.trim() ||
          anchor?.getAttribute("aria-label")?.trim() ||
          anchor?.textContent?.trim() ||
          "Empresa sem nome";

        const rawText = (card as HTMLElement).innerText || "";
        const phoneMatch = rawText.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/);
        const phone = phoneMatch ? normalizeBrowserPhone(phoneMatch[0]) : "-";

        const textParts = Array.from(
          card.querySelectorAll(".fontBodyMedium span, .fontBodyMedium div"),
        )
          .map((element) => element.textContent?.trim())
          .filter(Boolean);

        const address =
          textParts.find((text) => {
            const lower = text?.toLowerCase() || "";
            return (
              text &&
              text.length > 10 &&
              !text.includes("Â·") &&
              !text.includes("·") &&
              !lower.includes("aberto") &&
              !lower.includes("fechado") &&
              !lower.includes("estrelas") &&
              !lower.includes("avalia") &&
              text !== name
            );
          }) || "-";

        entries.push({
          href,
          companyName: name,
          phone,
          address,
          source: "Google Maps",
        });
      }

      return entries;
    })
    .catch(() => []);
};

export const scrapeGoogleMapsLeads = async (
  { niche, city, uf }: LocalizeIaSearchInput,
  options: LocalizeIaScrapeOptions = {},
): Promise<LocalizeIaLead[]> => {
  if (!niche || !city || !uf) throw new Error("Parametros invalidos");

  let browser;
  const startedAt = Date.now();
  const notifyLead = async (lead: LocalizeIaLead) => {
    await options.onLead?.(lead);
  };

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-audio-output",
        "--disable-software-rasterizer",
        "--disable-default-apps",
        "--disable-background-networking",
        "--disable-sync",
        "--disable-translate",
        "--metrics-recording-only",
        "--no-first-run",
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 800, height: 600 },
      userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
    });

    await context.route("**/*", (route: any) => {
      const type = route.request().resourceType();
      const url = route.request().url();
      if (["image", "media", "stylesheet", "font"].includes(type)) {
        return route.abort().catch(() => {});
      }
      if (
        url.includes("google-analytics") ||
        url.includes("doubleclick") ||
        url.includes("fonts.")
      ) {
        return route.abort().catch(() => {});
      }
      return route.continue().catch(() => {});
    });

    const page = await context.newPage();
    page.setDefaultTimeout(PANEL_TIMEOUT_MS);

    const query = encodeURIComponent(`${niche} em ${city}, ${uf}`);
    await page.goto(`https://www.google.com.br/maps/search/${query}`, {
      waitUntil: "domcontentloaded",
      timeout: SEARCH_TIMEOUT_MS,
    });

    const feedSelector = 'div[role="feed"]';
    const entriesByHref = new Map<string, LocalizeIaListEntry>();

    const rememberVisibleEntries = async () => {
      const visibleEntries = await collectListEntriesFromSearchPage(page);
      for (const entry of visibleEntries) {
        if (!entriesByHref.has(entry.href))
          entriesByHref.set(entry.href, entry);
      }
      return entriesByHref.size;
    };
    try {
      await page.waitForSelector(feedSelector, { timeout: PANEL_TIMEOUT_MS });
      let previousCount = 0;
      let idleScrolls = 0;

      for (let i = 0; i < MAX_SCROLL_STEPS; i++) {
        const currentCount = await rememberVisibleEntries();

        if (currentCount <= previousCount) {
          idleScrolls += 1;
        } else {
          idleScrolls = 0;
          previousCount = currentCount;
        }

        const reachedEnd = await page
          .evaluate(() => {
            const text = document.body?.innerText || "";
            return /fim da lista|chegou ao final da lista|reached the end|end of the list/i.test(
              text,
            );
          })
          .catch(() => false);

        if (reachedEnd || idleScrolls >= SCROLL_IDLE_LIMIT) break;

        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollBy(0, el.scrollHeight);
        }, feedSelector);
        await page.waitForTimeout(700);
      }

      await rememberVisibleEntries();
    } catch {
      console.log(
        "Aviso: Feed de resultados nao encontrado ou busca sem retorno.",
      );
    }

    const finalVisibleEntries = await page.evaluate(() => {
      const normalizeBrowserPhone = (rawPhone?: string | null) => {
        if (!rawPhone || rawPhone === "-") return "-";
        const onlyDigits = rawPhone.replace(/\D/g, "");
        if (onlyDigits.length === 11) {
          return onlyDigits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        }
        if (onlyDigits.length === 10) {
          return onlyDigits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }
        return rawPhone;
      };

      const entries: any[] = [];
      const seen = new Set<string>();
      const cards = document.querySelectorAll('div[role="article"]');

      for (const card of cards) {
        const anchor = card.querySelector('a[href*="/place/"]');
        const href = anchor?.getAttribute("href");
        if (!href || seen.has(href)) continue;

        seen.add(href);

        const name =
          card.querySelector(".fontHeadlineSmall")?.textContent?.trim() ||
          card.querySelector(".fontHeadlineLarge")?.textContent?.trim() ||
          "Empresa sem nome";

        const rawText = (card as HTMLElement).innerText || "";
        const phoneMatch = rawText.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/);
        const phone = phoneMatch ? normalizeBrowserPhone(phoneMatch[0]) : "-";

        const textParts = Array.from(
          card.querySelectorAll(".fontBodyMedium span, .fontBodyMedium div"),
        )
          .map((element) => element.textContent?.trim())
          .filter(Boolean);

        const address =
          textParts.find(
            (text) =>
              text &&
              text.length > 10 &&
              !text.includes("Â·") &&
              !text.toLowerCase().includes("aberto") &&
              !text.toLowerCase().includes("fechado") &&
              text !== name,
          ) || "-";

        entries.push({
          href,
          companyName: name,
          phone,
          address,
          source: "Google Maps",
        });
      }

      return entries;
    });

    for (const entry of finalVisibleEntries) {
      if (!entriesByHref.has(entry.href)) entriesByHref.set(entry.href, entry);
    }

    const listEntries = Array.from(entriesByHref.values());

    if (!listEntries.length) {
      await context.close();
      return [];
    }

    const processEntry = async (entry: LocalizeIaListEntry) => {
      let detailPage;
      try {
        if (Date.now() - startedAt >= TOTAL_SCRAPE_BUDGET_MS) return null;

        detailPage = await context.newPage();
        detailPage.setDefaultTimeout(PANEL_TIMEOUT_MS);

        await detailPage.goto(entry.href, {
          waitUntil: "domcontentloaded",
          timeout: DETAIL_TIMEOUT_MS,
        });
        await detailPage
          .locator("h1")
          .first()
          .waitFor({ timeout: PANEL_TIMEOUT_MS })
          .catch(() => {});

        const name =
          (await safeText(detailPage.locator("h1.DUwDvf"))) ||
          (await safeText(detailPage.locator("h1.fontHeadlineLarge"))) ||
          entry.companyName ||
          "Empresa sem nome";
        const phone = await extractPhoneFromDetailPage(detailPage, entry.phone);
        const contactLink = await extractContactLinkFromDetailPage(
          detailPage,
          phone,
        );
        const website = await extractWebsiteFromDetailPage(detailPage);
        const mapsCnpj = await extractCnpjFromDetailPage(detailPage);
        const validatedMapsCnpj = await validateCnpjWithBrasilApi(mapsCnpj, {
          city,
          uf,
        });
        const address =
          (await safeText(
            detailPage.locator(
              'button[data-item-id="address"] div.fontBodyMedium',
            ),
          )) ||
          (await safeText(
            detailPage.locator(
              'button[data-item-id*="address"] div.fontBodyMedium',
            ),
          )) ||
          entry.address;
        const cnpj =
          validatedMapsCnpj !== "-"
            ? validatedMapsCnpj
            : await firstKnownCnpj([
                extractCnpjFromWebsite(website, {
                  city,
                  uf,
                  companyName: name,
                }),
                extractCnpjFromCnpjBiz(name, city, uf),
                extractCnpjFromPublicSearch(name, city, uf, address),
              ]);

        if (name === "Empresa sem nome") return null;

        return sanitizeLead({
          companyName: name,
          phone: contactLink !== "-" ? contactLink : phone,
          website,
          cnpj,
          address,
          source: "Google Maps",
        });
      } catch {
        if (entry.companyName !== "Empresa sem nome") {
          const cnpj = await withTimeout(
            firstKnownCnpj([
              extractCnpjFromCnpjBiz(entry.companyName, city, uf),
              extractCnpjFromPublicSearch(
                entry.companyName,
                city,
                uf,
                entry.address,
              ),
            ]),
            CNPJ_LOOKUP_BUDGET_MS,
            "-",
          );

          return {
            ...fallbackLeadFromEntry(entry),
            cnpj,
          };
        }

        return null;
      } finally {
        if (detailPage) await detailPage.close().catch(() => {});
      }
    };

    const leads = await mapWithConcurrency(
      listEntries,
      DETAIL_CONCURRENCY,
      (entry) =>
        withTimeout(
          processEntry(entry),
          ENTRY_DETAIL_BUDGET_MS,
          fallbackLeadFromEntry(entry),
        ),
    );

    const econodataContext = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      userAgent: USER_AGENTS[0],
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
    });

    const enrichedLeads = await mapWithConcurrency(
      leads,
      ECONODATA_CONCURRENCY,
      async (lead) => {
        if (lead.cnpj !== "-") {
          await notifyLead(lead);
          return lead;
        }

        const cnpj = await withTimeout(
          extractCnpjFromEconodataPage(
            econodataContext,
            lead.companyName,
            city,
            uf,
            lead.address,
          ),
          ECONODATA_CNPJ_LOOKUP_MS,
          "-",
        );

        const enrichedLead = cnpj !== "-" ? { ...lead, cnpj } : lead;
        await notifyLead(enrichedLead);
        return enrichedLead;
      },
    );

    await econodataContext.close();
    await context.close();
    return enrichedLeads;
  } finally {
    if (browser) await browser.close();
  }
};
