import {
	type ColumnKey,
	DEFAULT_COLUMN_ORDER,
	DEFAULT_VISIBLE,
	sanitizeColumnOrder,
	sanitizeVisibleColumns,
} from "@/lib/appointments/columns";
import type { DisplayStyle, TimeScope } from "@/lib/calendar/layout";
import { VALID_SCOPES } from "@/lib/calendar/layout";

const DISPLAY_KEY = "big.appointments.display";
const SCOPE_KEY = "big.appointments.scope";
const COLUMN_ORDER_KEY = "big.appointments.columnOrder";
const VISIBLE_COLUMNS_KEY = "big.appointments.visibleColumns";

// Cookie names mirror display/scope so the server can SSR the saved view —
// without this the page renders the default day view, then flips to the saved
// view after client hydration, which looked like "appointments missing on
// refresh" because today is often empty.
export const DISPLAY_COOKIE = DISPLAY_KEY;
export const SCOPE_COOKIE = SCOPE_KEY;

export type ViewPrefs = {
	display: DisplayStyle;
	scope: TimeScope;
	columnOrder: ColumnKey[];
	visibleColumns: ColumnKey[];
};

export const DEFAULT_VIEW_PREFS: ViewPrefs = {
	display: "calendar",
	scope: "day",
	columnOrder: DEFAULT_COLUMN_ORDER,
	visibleColumns: DEFAULT_VISIBLE,
};

export function isDisplay(v: string | null | undefined): v is DisplayStyle {
	return v === "calendar" || v === "list" || v === "grid";
}

export function isScope(v: string | null | undefined): v is TimeScope {
	return v === "day" || v === "week" || v === "month";
}

// Resolve display+scope from raw cookie values (server-side). Falls back to
// defaults and keeps display/scope mutually consistent.
export function resolveViewModeFromCookies(
	rawDisplay: string | undefined,
	rawScope: string | undefined,
): { display: DisplayStyle; scope: TimeScope } {
	const display: DisplayStyle = isDisplay(rawDisplay)
		? rawDisplay
		: DEFAULT_VIEW_PREFS.display;
	const allowed = VALID_SCOPES[display];
	const scope: TimeScope =
		isScope(rawScope) && allowed.includes(rawScope) ? rawScope : allowed[0];
	return { display, scope };
}

function readJSON(key: string): unknown {
	const raw = window.localStorage.getItem(key);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function readViewPrefs(
	fallback: ViewPrefs = DEFAULT_VIEW_PREFS,
): ViewPrefs {
	if (typeof window === "undefined") return fallback;
	try {
		const display = window.localStorage.getItem(DISPLAY_KEY);
		const scope = window.localStorage.getItem(SCOPE_KEY);
		const d: DisplayStyle = isDisplay(display) ? display : fallback.display;
		const s: TimeScope = isScope(scope) ? scope : fallback.scope;
		const allowed = VALID_SCOPES[d];

		const order =
			sanitizeColumnOrder(readJSON(COLUMN_ORDER_KEY)) ?? fallback.columnOrder;
		const visible =
			sanitizeVisibleColumns(readJSON(VISIBLE_COLUMNS_KEY)) ??
			fallback.visibleColumns;

		return {
			display: d,
			scope: allowed.includes(s) ? s : allowed[0],
			columnOrder: order,
			visibleColumns: visible,
		};
	} catch {
		return fallback;
	}
}

export function writeViewPrefs(prefs: ViewPrefs) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(DISPLAY_KEY, prefs.display);
		window.localStorage.setItem(SCOPE_KEY, prefs.scope);
		window.localStorage.setItem(
			COLUMN_ORDER_KEY,
			JSON.stringify(prefs.columnOrder),
		);
		window.localStorage.setItem(
			VISIBLE_COLUMNS_KEY,
			JSON.stringify(prefs.visibleColumns),
		);
		// Mirror display/scope to cookies so SSR can render the saved view.
		const cookieAttrs = "path=/; max-age=31536000; samesite=lax";
		document.cookie = `${DISPLAY_COOKIE}=${encodeURIComponent(prefs.display)}; ${cookieAttrs}`;
		document.cookie = `${SCOPE_COOKIE}=${encodeURIComponent(prefs.scope)}; ${cookieAttrs}`;
	} catch {
		// ignore
	}
}
