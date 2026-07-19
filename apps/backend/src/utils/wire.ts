import type { Prisma } from '@prisma/client';

/**
 * Maps a Prisma query-result type to the shape it actually has once `res.json()`
 * serializes it: `Date` becomes `string`, `Prisma.Decimal` becomes `string`,
 * everything else recurses structurally. Prisma's own types describe the
 * *in-process* value (real `Date`/`Decimal` instances), while the wire contracts in
 * `@restaurante/shared` describe the *serialized* value — comparing them directly
 * would produce a wall of "Date is not assignable to string" noise that has nothing
 * to do with a genuine contract drift.
 *
 * `Wire<T>` bridges that gap for type-checking purposes only (see `assertWire`
 * below) so that a service function's declared `Promise<SharedType>` return type
 * still fails to compile when a field is renamed, removed, or genuinely changes
 * type — that's the actual drift guard.
 */
export type Wire<T> = T extends Date
  ? string
  : T extends Prisma.Decimal
    ? string
    : T extends (infer U)[]
      ? Wire<U>[]
      : T extends object
        ? { [K in keyof T]: Wire<T[K]> }
        : T;

/**
 * Identity at runtime — `res.json()` already performs the Date→string /
 * Decimal→string conversion via each value's `toJSON()`. This function only
 * changes the *type* TypeScript sees, so a Prisma result can be `return`ed from a
 * function whose signature promises a `@restaurante/shared` wire type without
 * false-positive Date/Decimal errors, while genuine shape drift still fails `tsc`.
 */
export function assertWire<T>(value: T): Wire<T> {
  return value as Wire<T>;
}
