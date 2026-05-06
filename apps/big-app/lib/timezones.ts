// Outlet timezone choices. Kept SEA-focused for the current customer base;
// extend when we onboard outlets outside this range.
//
// Stored on `outlets.timezone`. NOT yet consumed by display logic — all
// date/time UI currently renders in the browser's local TZ. See
// `docs/modules/12-config.md` for the consumption rollout plan.

export const SUPPORTED_TIMEZONES = [
	{ value: "Asia/Kuala_Lumpur", label: "(UTC+08:00) Kuala Lumpur" },
	{ value: "Asia/Singapore", label: "(UTC+08:00) Singapore" },
	{ value: "Asia/Manila", label: "(UTC+08:00) Manila" },
	{ value: "Asia/Hong_Kong", label: "(UTC+08:00) Hong Kong" },
	{ value: "Asia/Bangkok", label: "(UTC+07:00) Bangkok, Hanoi, Jakarta" },
	{ value: "Asia/Jakarta", label: "(UTC+07:00) Jakarta" },
	{ value: "Asia/Tokyo", label: "(UTC+09:00) Tokyo, Osaka" },
	{ value: "UTC", label: "(UTC+00:00) UTC" },
] as const;

export type TimezoneValue = (typeof SUPPORTED_TIMEZONES)[number]["value"];

export const SUPPORTED_TIMEZONE_VALUES = SUPPORTED_TIMEZONES.map(
	(t) => t.value,
) as [TimezoneValue, ...TimezoneValue[]];
