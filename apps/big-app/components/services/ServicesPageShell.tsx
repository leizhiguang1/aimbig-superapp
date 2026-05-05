"use client";

import { Construction } from "lucide-react";
import { useState } from "react";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";

type TabKey = "services" | "laboratory" | "vaccinations";

const TABS = [
	{ key: "services", label: "Services" },
	{ key: "laboratory", label: "Laboratory" },
	{ key: "vaccinations", label: "Vaccinations" },
];

export function ServicesPageShell({ children }: { children: React.ReactNode }) {
	const [activeTab, setActiveTab] = useState<TabKey>("services");

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			<div className="shrink-0">
				<SegmentedTabs
					tabs={TABS}
					active={activeTab}
					onChange={(key) => setActiveTab(key as TabKey)}
					size="sm"
					aria-label="Catalog sections"
				/>
			</div>
			{activeTab === "services" && children}
			{activeTab === "laboratory" && <NotImplemented label="Laboratory" />}
			{activeTab === "vaccinations" && <NotImplemented label="Vaccinations" />}
		</div>
	);
}

function NotImplemented({ label }: { label: string }) {
	return (
		<div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12">
			<div className="flex max-w-sm flex-col items-center gap-3 text-center">
				<div className="flex size-12 items-center justify-center rounded-full bg-muted">
					<Construction className="size-5 text-muted-foreground" />
				</div>
				<h3 className="font-medium text-foreground text-sm">
					{label} is not available yet
				</h3>
				<p className="text-muted-foreground text-xs leading-relaxed">
					This catalog tab hasn't been built. We're focusing on the Services
					catalog first; {label.toLowerCase()} will arrive in a later phase.
				</p>
			</div>
		</div>
	);
}
