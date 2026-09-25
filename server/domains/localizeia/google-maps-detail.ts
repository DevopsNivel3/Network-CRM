import {
  buildWhatsAppUrl,
  normalizeCnpj,
  normalizePhone,
  normalizeWebsiteUrl,
} from "./lead-normalization";

const LOCATOR_TIMEOUT_MS = 700;

export const safeText = async (locator: any) => {
  try {
    const value = await locator
      .first()
      .textContent({ timeout: LOCATOR_TIMEOUT_MS });
    return value?.trim() || null;
  } catch {
    return null;
  }
};

const safeAttribute = async (locator: any, attribute: string) => {
  try {
    const value = await locator
      .first()
      .getAttribute(attribute, { timeout: LOCATOR_TIMEOUT_MS });
    return value?.trim() || null;
  } catch {
    return null;
  }
};

export async function extractPhoneFromDetailPage(
  page: any,
  fallbackPhone = "-",
) {
  const directPhone =
    (await safeText(
      page.locator('button[data-item-id^="phone:tel:"] div.fontBodyMedium'),
    )) ||
    (await safeText(
      page.locator('button[data-item-id*="phone"] div.fontBodyMedium'),
    )) ||
    (await safeText(page.locator('a[href^="tel:"]'))) ||
    (
      await safeAttribute(
        page.locator('button[data-item-id^="phone:tel:"]'),
        "data-item-id",
      )
    )?.replace(/^phone:tel:/, "") ||
    (await safeAttribute(page.locator('a[href^="tel:"]'), "href"))?.replace(
      /^tel:/,
      "",
    );
  if (directPhone && directPhone !== "-") return normalizePhone(directPhone);

  const extracted = await page
    .evaluate(() => {
      const pattern = /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?\d{4,5}-?\d{4}/;
      const candidates: string[] = [];
      const selectors = [
        '[data-item-id*="phone"]',
        'button[aria-label*="telefone" i]',
        'button[aria-label*="phone" i]',
        'a[href^="tel:"]',
        '[aria-label*="telefone" i]',
        '[aria-label*="phone" i]',
      ];
      for (const selector of selectors) {
        for (const element of document.querySelectorAll(selector)) {
          candidates.push(
            element.getAttribute("data-item-id") || "",
            element.getAttribute("aria-label") || "",
            element.getAttribute("href") || "",
            element.textContent || "",
          );
        }
      }
      candidates.push(document.body?.innerText || "");
      for (const candidate of candidates) {
        const match = candidate.match(pattern);
        if (match) return match[0];
      }
      return null;
    })
    .catch(() => null);
  return normalizePhone(extracted || fallbackPhone);
}

export async function extractContactLinkFromDetailPage(
  page: any,
  fallbackPhone = "-",
) {
  const href =
    (await safeAttribute(page.locator('a[href^="tel:"]'), "href")) ||
    (await safeAttribute(
      page.locator('button[data-item-id^="phone:tel:"]'),
      "data-item-id",
    )) ||
    (await safeAttribute(
      page.locator('[data-item-id*="phone"]'),
      "data-item-id",
    ));
  if (href) {
    const whatsapp = buildWhatsAppUrl(
      href.replace(/^phone:tel:/, "").replace(/^tel:/, ""),
    );
    if (whatsapp !== "-") return whatsapp;
  }
  return buildWhatsAppUrl(
    await extractPhoneFromDetailPage(page, fallbackPhone),
  );
}

export async function extractWebsiteFromDetailPage(page: any) {
  const direct =
    (await safeAttribute(
      page.locator('a[data-item-id="authority"]'),
      "href",
    )) ||
    (await safeAttribute(
      page.locator('a[data-item-id*="authority"]'),
      "href",
    )) ||
    (await safeAttribute(page.locator('a[aria-label*="site" i]'), "href")) ||
    (await safeAttribute(page.locator('a[aria-label*="website" i]'), "href"));
  if (direct) return normalizeWebsiteUrl(direct);

  const extracted = await page
    .evaluate(() => {
      const candidates: string[] = [];
      for (const selector of [
        'a[data-item-id*="authority"]',
        'a[aria-label*="site" i]',
        'a[aria-label*="website" i]',
        'a[href^="http"]',
      ]) {
        for (const element of document.querySelectorAll(selector)) {
          candidates.push(
            element.getAttribute("href") || "",
            element.getAttribute("aria-label") || "",
            element.textContent || "",
          );
        }
      }
      return (
        candidates.find(
          (candidate) =>
            /^https?:\/\//i.test(candidate) &&
            !candidate.includes("google.") &&
            !candidate.includes("gstatic.") &&
            !candidate.includes("ggpht.") &&
            !candidate.includes("schema.org"),
        ) || null
      );
    })
    .catch(() => null);
  return normalizeWebsiteUrl(extracted || "-");
}

export async function extractCnpjFromDetailPage(page: any) {
  const cnpj = await page
    .evaluate(() => {
      const pattern =
        /(?:CNPJ\s*:?\s*)?(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i;
      const candidates: string[] = [];
      for (const selector of [
        '[aria-label*="CNPJ" i]',
        '[data-item-id*="cnpj" i]',
        '[data-tooltip*="CNPJ" i]',
        "button",
        "a",
      ]) {
        for (const element of document.querySelectorAll(selector)) {
          candidates.push(
            element.getAttribute("aria-label") || "",
            element.getAttribute("data-item-id") || "",
            element.getAttribute("data-tooltip") || "",
            element.textContent || "",
          );
        }
      }
      candidates.push(document.body?.innerText || "");
      for (const candidate of candidates) {
        const match = candidate.match(pattern);
        if (match) return match[1];
      }
      return null;
    })
    .catch(() => null);
  return normalizeCnpj(cnpj || "-");
}
