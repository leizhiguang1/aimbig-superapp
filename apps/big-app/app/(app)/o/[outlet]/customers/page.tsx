import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { CustomersContent } from "./customers-content";

export default function CustomersPage({
	params,
}: {
	params: Promise<{ outlet: string }>;
}) {
	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			<h2 className="shrink-0 font-semibold text-lg">Customers</h2>
			<Suspense
				fallback={<TableSkeleton columns={7} rows={8} showHeader={false} />}
			>
				<CustomersContent params={params} />
			</Suspense>
		</div>
	);
}
