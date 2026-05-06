"use client";

import { Info } from "lucide-react";
import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { setOutletTimezoneAction } from "@/lib/actions/outlets";
import type { Outlet } from "@/lib/services/outlets";
import { SUPPORTED_TIMEZONES } from "@/lib/timezones";

type RowOutlet = Pick<Outlet, "id" | "code" | "name" | "timezone">;

type Status = "idle" | "saving" | "saved" | { error: string };

export function TimezoneTab({ outlets }: { outlets: RowOutlet[] }) {
	return (
		<div className="space-y-4">
			<div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-muted-foreground text-sm">
				<Info className="mt-0.5 size-4 shrink-0" />
				<p>
					Timezone is saved per outlet but not yet applied to displayed dates
					and reports — all date and time UI currently renders in the browser's
					local timezone. We'll roll display formatting through outlet timezone
					in a later update.
				</p>
			</div>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Timezone Settings</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-24 pl-6">Code</TableHead>
								<TableHead>Outlet Name</TableHead>
								<TableHead className="w-72 pr-6">Time Zone</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{outlets.map((o) => (
								<OutletTimezoneRow key={o.id} outlet={o} />
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}

function OutletTimezoneRow({ outlet }: { outlet: RowOutlet }) {
	const [pending, startTransition] = useTransition();
	const [status, setStatus] = useState<Status>("idle");
	const [value, setValue] = useState(outlet.timezone);

	const onChange = (next: string) => {
		const previous = value;
		setValue(next);
		setStatus("saving");
		startTransition(async () => {
			const result = await setOutletTimezoneAction({
				outlet_id: outlet.id,
				timezone: next,
			});
			if ("error" in result) {
				setValue(previous);
				setStatus({ error: result.error });
				return;
			}
			setStatus("saved");
		});
	};

	return (
		<TableRow>
			<TableCell className="pl-6 font-mono text-xs">{outlet.code}</TableCell>
			<TableCell className="font-medium">{outlet.name}</TableCell>
			<TableCell className="pr-6">
				<div className="flex items-center gap-2">
					<Select value={value} onValueChange={onChange} disabled={pending}>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{SUPPORTED_TIMEZONES.map((tz) => (
								<SelectItem key={tz.value} value={tz.value}>
									{tz.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<span className="w-16 shrink-0 text-xs">
						{status === "saving" && (
							<span className="text-muted-foreground">Saving…</span>
						)}
						{status === "saved" && (
							<span className="text-emerald-600">Saved</span>
						)}
						{typeof status === "object" && (
							<span className="text-destructive" title={status.error}>
								Failed
							</span>
						)}
					</span>
				</div>
			</TableCell>
		</TableRow>
	);
}
