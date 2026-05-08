import { Cake, MessageSquare, Phone, User2 } from "lucide-react";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BirthdayCustomer } from "@/lib/services/dashboard";

type Props = { customers: BirthdayCustomer[] };

function fullName(c: BirthdayCustomer) {
	return `${c.firstName} ${c.lastName ?? ""}`.trim() || c.code;
}

function waLink(phone: string | null, name: string): string | null {
	if (!phone) return null;
	const digits = phone.replace(/\D/g, "");
	if (!digits) return null;
	const text = encodeURIComponent(
		`Happy birthday ${name}! Wishing you a wonderful day from us. 🎂`,
	);
	return `https://wa.me/${digits}?text=${text}`;
}

export function BirthdaysCard({ customers }: Props) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Cake className="size-4 text-pink-500" />
					Today's birthdays
				</CardTitle>
				<CardDescription>
					{customers.length === 0
						? "No customer birthdays today"
						: `${customers.length} customer${customers.length === 1 ? "" : "s"} celebrating today`}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{customers.length === 0 ? (
					<div className="rounded-md border border-dashed p-5 text-center text-muted-foreground text-sm">
						Quiet day — no birthdays.
					</div>
				) : (
					<TooltipProvider>
						<ul className="flex flex-col gap-2">
							{customers.map((c) => {
								const name = fullName(c);
								const wa = waLink(c.phone, c.firstName);
								return (
									<li
										key={c.id}
										className="flex items-center justify-between gap-3 rounded-md border p-3"
									>
										<div className="flex min-w-0 flex-1 items-start gap-3">
											<User2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
											<div className="min-w-0">
												<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
													<Link
														href={`/customers/${c.id}`}
														className="font-semibold hover:underline"
													>
														{name}
													</Link>
													<span className="text-muted-foreground text-xs tabular-nums">
														{c.code}
													</span>
												</div>
												<div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted-foreground text-xs">
													{c.phone && (
														<span className="tabular-nums">{c.phone}</span>
													)}
													<span>· {c.homeOutletCode}</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-1">
											{c.phone && (
												<Tooltip>
													<TooltipTrigger asChild>
														<a
															href={`tel:${c.phone}`}
															className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
															aria-label={`Call ${name}`}
														>
															<Phone className="size-4" />
														</a>
													</TooltipTrigger>
													<TooltipContent>Call</TooltipContent>
												</Tooltip>
											)}
											{wa && (
												<Tooltip>
													<TooltipTrigger asChild>
														<a
															href={wa}
															target="_blank"
															rel="noreferrer"
															className="inline-flex size-8 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50"
															aria-label={`Send WhatsApp birthday wish to ${name}`}
														>
															<MessageSquare className="size-4" />
														</a>
													</TooltipTrigger>
													<TooltipContent>Wish on WhatsApp</TooltipContent>
												</Tooltip>
											)}
										</div>
									</li>
								);
							})}
						</ul>
					</TooltipProvider>
				)}
			</CardContent>
		</Card>
	);
}
