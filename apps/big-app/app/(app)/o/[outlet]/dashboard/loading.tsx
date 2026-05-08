import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-7 w-40" />
				<Skeleton className="h-4 w-64" />
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-24 rounded-xl" />
				))}
			</div>

			{Array.from({ length: 4 }).map((_, row) => (
				<div key={row} className="grid gap-4 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-72 rounded-xl" />
					))}
				</div>
			))}

			<div className="grid gap-4 lg:grid-cols-3">
				<Skeleton className="h-80 rounded-xl" />
				<Skeleton className="h-80 rounded-xl lg:col-span-2" />
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Skeleton className="h-72 rounded-xl" />
				<Skeleton className="h-72 rounded-xl" />
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Skeleton className="h-72 rounded-xl" />
				<Skeleton className="h-72 rounded-xl" />
			</div>
		</div>
	);
}
