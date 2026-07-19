// /customers, /clients/lookup/dni — apps/backend/src/services/customers.service.ts
//
// `Customer` itself lives in common.ts (it's a nested relation on Order/Payment
// responses too, not just this module) — see the note there.

// POST /customers
export interface CreateCustomerRequest {
  documentNumber: string;
  firstName: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
}

// GET /clients/lookup/dni/:dni — proxies APIPeru; not itself a Customer record.
export interface DniLookupResponse {
  documentNumber: string;
  firstName: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  fullName: string;
}
