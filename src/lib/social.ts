/** Brand identity the social mockups need — built from CompanySettings. */
export interface CompanyBrand {
  name: string;
  logoUrl: string | null;
  /** Instagram handle without "@", e.g. "sma_eng". */
  instagramHandle?: string | null;
}

/** Extracts "sma_eng" from "https://www.instagram.com/sma_eng/" (or returns a slug of the company name). */
export function instagramHandleFrom(socialNetworks: unknown, companyName: string): string {
  const networks =
    socialNetworks && typeof socialNetworks === "object" && !Array.isArray(socialNetworks)
      ? (socialNetworks as Record<string, unknown>)
      : {};
  const url = typeof networks.instagram === "string" ? networks.instagram : "";
  const match = url.match(/instagram\.com\/([A-Za-z0-9._]+)/);
  if (match) return match[1];
  return (
    companyName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "empresa"
  );
}

export function brandFromSettings(settings: { companyName: string; logoUrl: string | null; socialNetworks: unknown }): CompanyBrand {
  return {
    name: settings.companyName,
    logoUrl: settings.logoUrl,
    instagramHandle: instagramHandleFrom(settings.socialNetworks, settings.companyName),
  };
}
