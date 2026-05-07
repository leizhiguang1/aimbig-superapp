"use client";

import { usePathname } from "next/navigation";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { useOutletPath } from "@/hooks/use-outlet-path";

type TabKey = "listing" | "roles" | "positions" | "commission";

const BASE_TABS: ReadonlyArray<{ key: TabKey; base: string; label: string }> = [
	{ key: "listing", base: "/employees", label: "Listing" },
	{ key: "roles", base: "/employees/roles", label: "Roles" },
	{ key: "positions", base: "/employees/positions", label: "Positions" },
	{ key: "commission", base: "/employees/commission", label: "Commission" },
];

export function EmployeesTabs({ visible }: { visible: TabKey[] }) {
	const pathname = usePathname();
	const path = useOutletPath();
	const allowed = new Set(visible);
	const tabs = BASE_TABS.filter((t) => allowed.has(t.key)).map((t) => {
		const href = path(t.base);
		return { key: href, label: t.label, href };
	});
	if (tabs.length === 0) return null;
	return (
		<SegmentedTabs
			aria-label="Employees sections"
			active={pathname}
			tabs={tabs}
		/>
	);
}
