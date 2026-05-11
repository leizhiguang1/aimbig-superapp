"use client";

import { ShoppingCart, UserRound } from "lucide-react";

type Props = {
	hasCustomer: boolean;
	hasOutlet: boolean;
	onSelectCustomer: () => void;
	onAddItem: () => void;
};

export function EmptyCartCTA({
	hasCustomer,
	hasOutlet,
	onSelectCustomer,
	onAddItem,
}: Props) {
	const ready = hasCustomer && hasOutlet;
	return (
		<div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
			{!hasCustomer ? (
				<>
					<div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
						<UserRound className="size-6" />
					</div>
					<div>
						<div className="text-base font-semibold">Pick a customer</div>
						<div className="mt-1 text-sm text-muted-foreground">
							Start by selecting who this sale is for.
						</div>
					</div>
					<button
						type="button"
						onClick={onSelectCustomer}
						className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
					>
						<UserRound className="size-4" />
						Select customer
					</button>
				</>
			) : !hasOutlet ? (
				<div className="text-sm text-muted-foreground">
					Select an outlet above to continue.
				</div>
			) : (
				<>
					<div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
						<ShoppingCart className="size-6" />
					</div>
					<div>
						<div className="text-base font-semibold">Add items to the sale</div>
						<div className="mt-1 text-sm text-muted-foreground">
							Pick services or products — you can tune price, quantity and
							discount on each line.
						</div>
					</div>
					<button
						type="button"
						onClick={onAddItem}
						disabled={!ready}
						className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
					>
						<ShoppingCart className="size-4" />
						Add items
					</button>
				</>
			)}
		</div>
	);
}
