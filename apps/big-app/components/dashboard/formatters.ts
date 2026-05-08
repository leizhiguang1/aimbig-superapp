export type ValueKind = "number" | "myr";

export function fmtValue(n: number, kind: ValueKind): string {
	if (kind === "myr") {
		return `MYR ${n.toLocaleString("en-MY", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;
	}
	return n.toLocaleString();
}

export function fmtAxisShort(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
	return String(n);
}
