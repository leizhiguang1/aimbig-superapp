export function fullName(
	first: string | null | undefined,
	last: string | null | undefined,
): string {
	return [first, last].filter(Boolean).join(" ").trim();
}
