import type { PostgrestError } from "@supabase/supabase-js";
import type { Context } from "@/lib/context/types";
import {
	ConflictError,
	UnauthorizedError,
	ValidationError,
} from "@/lib/errors";

export function assertBrandId(ctx: Context): string {
	if (!ctx.brandId) throw new UnauthorizedError("Brand context required");
	return ctx.brandId;
}

type ConstraintMap = {
	/** Mapped to ConflictError when Postgres returns 23505 (unique_violation). */
	uniqueMsg?: string;
	/** Mapped to ConflictError when Postgres returns 23503 (foreign_key_violation). */
	fkMsg?: string;
};

/**
 * Translates a Supabase PostgrestError into a typed ServiceError.
 *
 * Use after a write op when the surrounding code has done
 * `if (error) throwDbError(error, { uniqueMsg: ..., fkMsg: ... });`
 *
 * Falls back to ValidationError(error.message) when no constraint matches.
 * Never returns — the type is `never` so TypeScript narrows the data var.
 */
export function throwDbError(
	error: PostgrestError,
	map?: ConstraintMap,
): never {
	if (error.code === "23505" && map?.uniqueMsg) {
		throw new ConflictError(map.uniqueMsg);
	}
	if (error.code === "23503" && map?.fkMsg) {
		throw new ConflictError(map.fkMsg);
	}
	throw new ValidationError(error.message);
}
