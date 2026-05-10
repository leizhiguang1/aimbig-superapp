type Gender = "male" | "female";

export type IcParseResult =
	| { ok: true; digits: string; dob: string; gender: Gender }
	| { ok: false; digits: string; reason: "empty" | "length" | "date" };

// Parses a Malaysian IC number into DOB + gender.
// Pivot: 2-digit years <= current YY → 20YY, else 19YY.
export function parseMalaysianIc(raw: string): IcParseResult {
	const digits = raw.replace(/\D/g, "");
	if (digits.length === 0) return { ok: false, digits, reason: "empty" };
	if (digits.length !== 12) return { ok: false, digits, reason: "length" };
	const yy = Number.parseInt(digits.slice(0, 2), 10);
	const mm = Number.parseInt(digits.slice(2, 4), 10);
	const dd = Number.parseInt(digits.slice(4, 6), 10);
	if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
		return { ok: false, digits, reason: "date" };
	}
	const currentYY = new Date().getFullYear() % 100;
	const fullYear = yy <= currentYY ? 2000 + yy : 1900 + yy;
	const date = new Date(Date.UTC(fullYear, mm - 1, dd));
	if (
		date.getUTCFullYear() !== fullYear ||
		date.getUTCMonth() !== mm - 1 ||
		date.getUTCDate() !== dd
	) {
		return { ok: false, digits, reason: "date" };
	}
	const dob = `${fullYear.toString().padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
	const lastDigit = Number.parseInt(digits.slice(11, 12), 10);
	const gender: Gender = lastDigit % 2 === 0 ? "female" : "male";
	return { ok: true, digits, dob, gender };
}
