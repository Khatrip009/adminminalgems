// src/tax.api.ts

import { apiFetch } from "../lib/apiClient";

export interface TaxRule {
  id: string;
  country: string;
  state: string | null;
  rate: number; // e.g. 0.18 for 18%
  created_at: string;
  updated_at: string;
}

export interface ListTaxRulesResponse {
  ok: boolean;
  rules: TaxRule[];
}

export interface CreateTaxRuleInput {
  country: string; // "INDIA"
  state?: string | null; // "GUJARAT" or null for country-level
  rate: number; // 0.18 for 18%
}

export interface UpdateTaxRuleInput extends Partial<CreateTaxRuleInput> {}

export interface CalculateTaxInput {
  country: string;
  state?: string | null;
  subtotal: number;
}

export interface CalculateTaxResponse {
  ok: boolean;
  rate: number;
  tax_amount: number;
}

// ---------- ADMIN: LIST RULES ----------
export async function listTaxRules(): Promise<ListTaxRulesResponse> {
  return apiFetch("/tax/rules");
}

// ---------- ADMIN: CREATE ----------
export async function createTaxRule(
  data: CreateTaxRuleInput
): Promise<{ ok: boolean; rule: TaxRule }> {
  return apiFetch("/tax/rules", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---------- ADMIN: UPDATE ----------
export async function updateTaxRule(
  id: string,
  data: UpdateTaxRuleInput
): Promise<{ ok: boolean; rule: TaxRule }> {
  return apiFetch(`/tax/rules/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ---------- ADMIN: DELETE ----------
export async function deleteTaxRule(
  id: string
): Promise<{ ok: boolean }> {
  return apiFetch(`/tax/rules/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ---------- PUBLIC: CALCULATE TAX ----------
export async function calculateTax(
  data: CalculateTaxInput
): Promise<CalculateTaxResponse> {
  return apiFetch("/tax/calculate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
