"use client";

import { SegmentedTabs } from "@/components/ui/segmented-tabs";

export type DetailTabKey =
	| "overview"
	| "casenotes"
	| "dental-assessment"
	| "periodontal-charting"
	| "followup"
	| "camera"
	| "documents"
	| "billing";

const TABS: { key: DetailTabKey; label: string }[] = [
	{ key: "overview", label: "Overview" },
	{ key: "casenotes", label: "Case notes" },
	{ key: "billing", label: "Billing" },
	{ key: "dental-assessment", label: "Dental assessment" },
	{ key: "periodontal-charting", label: "Periodontal charting" },
	{ key: "followup", label: "Follow up" },
	{ key: "camera", label: "Camera" },
	{ key: "documents", label: "Documents" },
];

type Props = {
	activeTab: DetailTabKey;
	onChange: (key: DetailTabKey) => void;
	canSeeCaseNotes?: boolean;
	canCaseBilling?: boolean;
};

export function DetailTabs({
	activeTab,
	onChange,
	canSeeCaseNotes = true,
	canCaseBilling = true,
}: Props) {
	const tabs = TABS.filter((t) => {
		if (t.key === "casenotes" && !canSeeCaseNotes) return false;
		if (t.key === "billing" && !canCaseBilling) return false;
		return true;
	});
	return (
		<SegmentedTabs
			aria-label="Appointment detail sections"
			active={activeTab}
			onChange={(key) => onChange(key as DetailTabKey)}
			tabs={tabs}
			size="sm"
		/>
	);
}
