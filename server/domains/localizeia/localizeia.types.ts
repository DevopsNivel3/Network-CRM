export interface LocalizeIaSearchInput {
  niche: string;
  city: string;
  uf: string;
}

export interface LocalizeIaLead {
  companyName: string;
  phone: string;
  website: string;
  cnpj: string;
  address: string;
  source: string;
}

export interface LocalizeIaScrapeOptions {
  onLead?: (lead: LocalizeIaLead) => void | Promise<void>;
}

export interface LocalizeIaListEntry {
  href: string;
  companyName: string;
  phone: string;
  address: string;
  source: string;
}

export interface BrasilApiCnpjResponse {
  cnpj?: string;
  uf?: string;
  municipio?: string;
  razao_social?: string;
  nome_fantasia?: string;
}
