// ─── Brazil Geo Service ───────────────────────────────────────────────────────
// Uses:
//   ViaCEP  → https://viacep.com.br/ws/{cep}/json/
//   IBGE    → https://servicodados.ibge.gov.br/api/v1/localidades

export interface CepResult {
  logradouro: string; // street
  bairro: string;     // neighborhood
  localidade: string; // city
  uf: string;         // state UF
  erro?: boolean;
}

export interface BrazilState {
  id: number;
  sigla: string; // UF
  nome: string;  // full name
}

export interface BrazilCity {
  id: number;
  nome: string;
}

/**
 * Fetches address data from ViaCEP based on CEP (zip code).
 * Returns null on error or when CEP is not found.
 */
export async function fetchAddressByCep(cep: string): Promise<CepResult | null> {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    if (!res.ok) return null;
    const data: CepResult = await res.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetches all Brazilian states from IBGE, sorted by name.
 */
export async function fetchStates(): Promise<BrazilState[]> {
  try {
    const res = await fetch(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'
    );
    if (!res.ok) return [];
    const data: BrazilState[] = await res.json();
    return data;
  } catch {
    return [];
  }
}

/**
 * Fetches all cities for a given state UF from IBGE, sorted by name.
 */
export async function fetchCitiesByState(uf: string): Promise<BrazilCity[]> {
  if (!uf) return [];
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`
    );
    if (!res.ok) return [];
    const data: BrazilCity[] = await res.json();
    return data;
  } catch {
    return [];
  }
}
