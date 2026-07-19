// Cross-cutting wire types shared by every module.
// These describe the JSON-over-HTTP contract, not the Prisma/DB schema.

/**
 * ISO-8601 date-time string as it travels over JSON (e.g. "2026-07-18T10:00:00.000Z").
 * Every Prisma `DateTime` field becomes this on the wire — `Date` objects are
 * serialized to strings by `res.json()`, never sent as `Date` instances.
 */
export type IsoDateString = string;

/**
 * Prisma `Decimal` fields serialize to a string via `Decimal#toJSON()` when they come
 * straight from a Prisma query result. Some endpoints instead return a plain JS number
 * (aggregates with a `|| 0` fallback, values computed in application code before being
 * handed to `res.json()`). The wire type has to allow both — narrowing to `string` would
 * be wrong for the computed-number code paths and vice versa.
 */
export type DecimalString = string | number;

/** Every error response in this API has this exact shape: `res.status(x).json({ error: '...' }) `. */
export interface ApiErrorResponse {
  error: string;
}

/** Common shape for endpoints that only confirm an action succeeded (deletes, etc.). */
export interface ApiMessageResponse {
  message: string;
}

/**
 * Appears as a nested relation on `Order` and `Payment` responses (see orders.ts,
 * payments.ts) as well as being the entity behind `/customers` itself (see
 * customers.ts for that module's request/response types) — kept here instead of
 * duplicated across those files.
 */
export interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  documentNumber: string | null;
  address: string | null;
  notes: string | null;
  birthDate: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}
