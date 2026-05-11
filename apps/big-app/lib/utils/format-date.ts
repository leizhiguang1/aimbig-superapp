// Display-only date formatters used across customer-facing history views.
// All functions take a `Date` and return a localized string; no timezone work.

function pad2(n: number) {
	return n < 10 ? `0${n}` : String(n);
}

export function formatDayMonthYear(d: Date) {
	return d.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

export function formatWeekdayTime(d: Date) {
	return `${d.toLocaleDateString("en-GB", { weekday: "short" })} · ${d.toLocaleTimeString(
		"en-GB",
		{ hour: "numeric", minute: "2-digit", hour12: true },
	)}`;
}

export function formatDateTimeNumeric(d: Date) {
	const dd = pad2(d.getDate());
	const mm = pad2(d.getMonth() + 1);
	const yyyy = d.getFullYear();
	const hour24 = d.getHours();
	const ampm = hour24 >= 12 ? "PM" : "AM";
	const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
	const minute = pad2(d.getMinutes());
	return `${dd}/${mm}/${yyyy} ${hour12}:${minute} ${ampm}`;
}

export function formatDateTime24(d: Date) {
	const dd = pad2(d.getDate());
	const mm = pad2(d.getMonth() + 1);
	const yyyy = d.getFullYear();
	const hh = pad2(d.getHours());
	const min = pad2(d.getMinutes());
	const ss = pad2(d.getSeconds());
	return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

function ordinal(n: number) {
	const s = ["th", "st", "nd", "rd"];
	const v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatHeaderDate(d: Date) {
	const month = d.toLocaleDateString("en-US", { month: "short" });
	const year = d.getFullYear();
	return `${ordinal(d.getDate())} ${month} ${year}`;
}

export function formatHeaderTime(d: Date) {
	const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
	const hour24 = d.getHours();
	const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
	const ampm = hour24 >= 12 ? "PM" : "AM";
	return `${weekday} · ${pad2(hour12)}:${pad2(d.getMinutes())} ${ampm}`;
}
