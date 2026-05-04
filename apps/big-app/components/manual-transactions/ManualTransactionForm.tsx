"use client";

import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { CustomerWithRelations } from "@/lib/services/customers";
import type { ServiceWithCategory } from "@/lib/services/services";
import type { OutletWithRoomCount } from "@/lib/services/outlets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CartItem = {
	key: string;
	item_type: "service" | "product";
	service_id: string | null;
	inventory_item_id: string | null;
	item_name: string;
	item_code: string | null;
	unit_price: number;
	quantity: number;
};

type Step = "customer" | "items" | "review";
type ItemTab = "services" | "products";

export function ManualTransactionForm({
	customers,
	outlets,
	services,
	defaultOutletId,
	onBack,
	onCreate,
}: {
	customers: CustomerWithRelations[];
	outlets: OutletWithRoomCount[];
	services: ServiceWithCategory[];
	defaultOutletId: string | null;
	onBack: () => void;
	onCreate: (input: unknown) => Promise<{ id: string; code: string }>;
}) {
	const [step, setStep] = useState<Step>("customer");
	const [itemTab, setItemTab] = useState<ItemTab>("services");
	const [outletId, setOutletId] = useState(defaultOutletId ?? "");
	const [selectedCustomer, setSelectedCustomer] =
		useState<CustomerWithRelations | null>(null);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [remarks, setRemarks] = useState("");
	const [customerSearch, setCustomerSearch] = useState("");
	const [itemSearch, setItemSearch] = useState("");
	const [isPending, startTransition] = useTransition();
	const [submitError, setSubmitError] = useState<string | null>(null);

	const filteredCustomers = useMemo(() => {
		const q = customerSearch.toLowerCase();
		if (!q) return customers.slice(0, 50);
		return customers
			.filter(
				(c) =>
					c.first_name.toLowerCase().includes(q) ||
					(c.last_name ?? "").toLowerCase().includes(q) ||
					c.code.toLowerCase().includes(q) ||
					(c.phone ?? "").includes(q),
			)
			.slice(0, 50);
	}, [customers, customerSearch]);

	const filteredServices = useMemo(() => {
		const q = itemSearch.toLowerCase();
		return services.filter(
			(s) =>
				s.name.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q),
		);
	}, [services, itemSearch]);

	function addService(svc: ServiceWithCategory) {
		const key = `svc-${svc.id}`;
		setCart((prev) => {
			const existing = prev.find((i) => i.key === key);
			if (existing)
				return prev.map((i) =>
					i.key === key ? { ...i, quantity: i.quantity + 1 } : i,
				);
			return [
				...prev,
				{
					key,
					item_type: "service",
					service_id: svc.id,
					inventory_item_id: null,
					item_name: svc.name,
					item_code: svc.sku,
					unit_price: svc.price ?? 0,
					quantity: 1,
				},
			];
		});
	}

	function updateCartItem(
		key: string,
		field: "unit_price" | "quantity",
		value: number,
	) {
		setCart((prev) =>
			prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)),
		);
	}

	function removeCartItem(key: string) {
		setCart((prev) => prev.filter((i) => i.key !== key));
	}

	const total = cart.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

	function handleSubmit() {
		if (!selectedCustomer || !outletId || cart.length === 0) return;
		setSubmitError(null);
		startTransition(async () => {
			try {
				await onCreate({
					customer_id: selectedCustomer.id,
					outlet_id: outletId,
					remarks: remarks.trim() || null,
					items: cart.map((i) => ({
						item_type: i.item_type,
						service_id: i.service_id,
						inventory_item_id: i.inventory_item_id,
						item_name: i.item_name,
						item_code: i.item_code,
						unit_price: i.unit_price,
						quantity: i.quantity,
					})),
				});
			} catch (e) {
				setSubmitError(e instanceof Error ? e.message : "Something went wrong");
			}
		});
	}

	const stepLabels: Record<Step, string> = {
		customer: "Customer",
		items: "Items",
		review: "Review",
	};

	return (
		<div className="flex flex-col">
			{/* Step header */}
			<div className="flex items-center gap-3 border-b px-6 py-3">
				<Button
					variant="ghost"
					size="icon"
					className="size-8"
					onClick={
						step === "customer"
							? onBack
							: () => setStep(step === "review" ? "items" : "customer")
					}
				>
					<ArrowLeft className="size-4" />
				</Button>
				<div className="flex gap-3 text-sm">
					{(["customer", "items", "review"] as Step[]).map((s, idx) => (
						<span
							key={s}
							className={cn(
								step === s
									? "font-semibold text-foreground"
									: "text-muted-foreground",
							)}
						>
							{idx + 1}. {stepLabels[s]}
						</span>
					))}
				</div>
			</div>

			{/* Step 1: Customer */}
			{step === "customer" && (
				<div className="flex flex-col gap-4 p-6">
					{outlets.length > 1 && (
						<div className="space-y-1.5">
							<Label>Outlet</Label>
							<select
								className="w-full rounded-md border bg-background px-3 py-2 text-sm"
								value={outletId}
								onChange={(e) => setOutletId(e.target.value)}
							>
								<option value="">Select outlet…</option>
								{outlets.map((o) => (
									<option key={o.id} value={o.id}>
										{o.name}
									</option>
								))}
							</select>
						</div>
					)}
					<div className="space-y-1.5">
						<Label>Search customer</Label>
						<div className="relative">
							<Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
							<Input
								className="pl-9"
								placeholder="Name, code, or phone…"
								value={customerSearch}
								onChange={(e) => setCustomerSearch(e.target.value)}
								autoFocus
							/>
						</div>
					</div>
					<div className="max-h-72 divide-y overflow-y-auto rounded-md border">
						{filteredCustomers.length === 0 ? (
							<p className="py-8 text-center text-sm text-muted-foreground">
								No customers found
							</p>
						) : (
							filteredCustomers.map((c) => {
								const name = `${c.first_name}${c.last_name ? ` ${c.last_name}` : ""}`;
								return (
									<button
										key={c.id}
										type="button"
										className={cn(
											"flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
											selectedCustomer?.id === c.id && "bg-muted",
										)}
										onClick={() => {
											setSelectedCustomer(c);
											if (outletId) setStep("items");
										}}
									>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">{name}</p>
											<p className="text-xs text-muted-foreground">
												{c.code}
												{c.phone ? ` · ${c.phone}` : ""}
											</p>
										</div>
									</button>
								);
							})
						)}
					</div>
					{selectedCustomer && !outletId && (
						<p className="text-xs text-destructive">
							Please select an outlet first.
						</p>
					)}
				</div>
			)}

			{/* Step 2: Items */}
			{step === "items" && (
				<div className="flex flex-col gap-4 p-6">
					{/* Tab switcher */}
					<div className="flex rounded-md border p-1 gap-1">
						{(["services", "products"] as ItemTab[]).map((t) => (
							<button
								key={t}
								type="button"
								onClick={() => setItemTab(t)}
								className={cn(
									"flex-1 rounded py-1.5 text-sm font-medium capitalize transition-colors",
									itemTab === t
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{t}
							</button>
						))}
					</div>

					<div className="relative">
						<Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
						<Input
							className="pl-9"
							placeholder="Search…"
							value={itemSearch}
							onChange={(e) => setItemSearch(e.target.value)}
						/>
					</div>

					{itemTab === "services" && (
						<div className="max-h-56 divide-y overflow-y-auto rounded-md border">
							{filteredServices.length === 0 ? (
								<p className="py-6 text-center text-sm text-muted-foreground">
									No services found
								</p>
							) : (
								filteredServices.map((svc) => (
									<button
										key={svc.id}
										type="button"
										className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-muted/50"
										onClick={() => addService(svc)}
									>
										<div>
											<p className="font-medium">{svc.name}</p>
											<p className="text-xs text-muted-foreground">{svc.sku}</p>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-muted-foreground">
												MYR {(svc.price ?? 0).toFixed(2)}
											</span>
											<Plus className="size-4 text-primary" />
										</div>
									</button>
								))
							)}
						</div>
					)}

					{itemTab === "products" && (
						<p className="py-6 text-center text-sm text-muted-foreground">
							Product selection coming soon.
						</p>
					)}

					{/* Cart */}
					{cart.length > 0 && (
						<div className="space-y-2">
							<p className="text-xs font-medium uppercase text-muted-foreground">
								Selected ({cart.length})
							</p>
							<div className="divide-y rounded-md border">
								{cart.map((item) => (
									<div
										key={item.key}
										className="flex items-center gap-3 px-4 py-2.5"
									>
										<div className="min-w-0 flex-1 text-sm">
											<p className="truncate font-medium">{item.item_name}</p>
										</div>
										<div className="flex items-center gap-2">
											<Input
												type="number"
												className="h-7 w-16 text-center text-sm"
												value={item.quantity}
												min={1}
												onChange={(e) =>
													updateCartItem(
														item.key,
														"quantity",
														Math.max(1, Number(e.target.value)),
													)
												}
											/>
											<span className="text-xs text-muted-foreground">×</span>
											<Input
												type="number"
												className="h-7 w-24 text-sm"
												value={item.unit_price}
												min={0}
												step={0.01}
												onChange={(e) =>
													updateCartItem(
														item.key,
														"unit_price",
														Number(e.target.value),
													)
												}
											/>
											<button
												type="button"
												onClick={() => removeCartItem(item.key)}
												className="text-muted-foreground hover:text-destructive"
											>
												<Trash2 className="size-3.5" />
											</button>
										</div>
									</div>
								))}
							</div>
							<div className="flex justify-end text-sm font-semibold">
								Total: MYR {total.toFixed(2)}
							</div>
						</div>
					)}

					<div className="flex justify-end">
						<Button disabled={cart.length === 0} onClick={() => setStep("review")}>
							Continue
						</Button>
					</div>
				</div>
			)}

			{/* Step 3: Review */}
			{step === "review" && selectedCustomer && (
				<div className="flex flex-col gap-5 p-6">
					<div className="rounded-md bg-muted/50 px-4 py-3 text-sm">
						<p className="text-xs font-medium uppercase text-muted-foreground">
							Customer
						</p>
						<p className="mt-0.5 font-medium">
							{selectedCustomer.first_name}
							{selectedCustomer.last_name
								? ` ${selectedCustomer.last_name}`
								: ""}
						</p>
						<p className="text-xs text-muted-foreground">
							{selectedCustomer.code}
						</p>
					</div>

					<div className="divide-y rounded-md border">
						{cart.map((item) => (
							<div
								key={item.key}
								className="flex items-center justify-between px-4 py-3 text-sm"
							>
								<div>
									<p className="font-medium">{item.item_name}</p>
									<p className="text-xs text-muted-foreground">
										Qty {item.quantity} @ MYR {item.unit_price.toFixed(2)}
									</p>
								</div>
								<span>MYR {(item.unit_price * item.quantity).toFixed(2)}</span>
							</div>
						))}
						<div className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
							<span>Total</span>
							<span>MYR {total.toFixed(2)}</span>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="remarks">Remarks (optional)</Label>
						<Textarea
							id="remarks"
							placeholder="e.g. Outstanding balance payment for SO-000123"
							value={remarks}
							onChange={(e) => setRemarks(e.target.value)}
							rows={3}
						/>
					</div>

					{submitError && (
						<p className="text-sm text-destructive">{submitError}</p>
					)}

					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setStep("items")}>
							Back
						</Button>
						<Button onClick={handleSubmit} disabled={isPending}>
							{isPending ? "Saving…" : "Create Transaction"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
