"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { BrandConfigItem } from "@/lib/services/brand-config";

export type CustomerTagConfig = {
	code: string;
	label: string;
	color: string | null;
};

type Ctx = {
	byCode: Map<string, CustomerTagConfig>;
};

const CustomerTagsCtx = createContext<Ctx | null>(null);

export function CustomerTagsProvider({
	tags,
	children,
}: {
	tags: BrandConfigItem[];
	children: ReactNode;
}) {
	const value = useMemo<Ctx>(() => {
		const byCode = new Map<string, CustomerTagConfig>();
		for (const row of tags) {
			if (!row.is_active) continue;
			byCode.set(row.code, {
				code: row.code,
				label: row.label,
				color: row.color,
			});
		}
		return { byCode };
	}, [tags]);
	return (
		<CustomerTagsCtx.Provider value={value}>{children}</CustomerTagsCtx.Provider>
	);
}

// Resolve a stored tag value (code or free-text) against the brand vocabulary.
// Returns null when no provider is mounted; consumers should treat that as
// "render the raw value as a plain chip".
export function useCustomerTag(code: string | null | undefined) {
	const ctx = useContext(CustomerTagsCtx);
	if (!code) return null;
	if (!ctx) return null;
	return ctx.byCode.get(code) ?? null;
}
