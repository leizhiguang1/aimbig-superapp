"use client";

import {
	Archive,
	BarChart2,
	BookOpen,
	Bot,
	Calendar,
	CalendarDays,
	Contact,
	KeyRound,
	LayoutDashboard,
	MessageCircle,
	MessageSquare,
	Settings,
	ShoppingCart,
	Smartphone,
	Stethoscope,
	Store,
	Ticket,
	UserCog,
	Users,
	Zap,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	SidebarNavItem,
	type SidebarNavItemData,
} from "@/components/shell/sidebar-nav-item";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { outletPath } from "@/lib/outlet-path";

const baseNavItems: SidebarNavItemData[] = [
	{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ label: "Appointments", href: "/appointments", icon: Calendar },
	{ label: "Customers", href: "/customers", icon: Users },
	{ label: "Sales", href: "/sales", icon: ShoppingCart },
	{ label: "Roster", href: "/roster", icon: CalendarDays },
	{ label: "Services", href: "/services", icon: Stethoscope },
	{ label: "Inventory", href: "/inventory", icon: Archive },
	{ label: "Employees", href: "/employees", icon: UserCog },
	{ label: "Voucher", href: "/voucher", icon: Ticket },
	{ label: "Passcode", href: "/passcode", icon: KeyRound },
	{ label: "Reports", href: "/reports", icon: BarChart2 },
	{ label: "Webstore", href: "/webstore", icon: Store },
	{ label: "Config", href: "/config", icon: Settings },
];

const baseWhatsappNavItems: SidebarNavItemData[] = [
	{
		label: "Inbox",
		href: "/chats",
		icon: MessageCircle,
		variant: "whatsapp",
	},
	{
		label: "WhatsApp",
		href: "/whatsapp",
		icon: MessageSquare,
		variant: "whatsapp",
	},
	{ label: "Contacts", href: "/contacts", icon: Contact, variant: "whatsapp" },
	{
		label: "Automations",
		href: "/automations",
		icon: Zap,
		variant: "whatsapp",
	},
	{ label: "AI Bot", href: "/ai", icon: Bot, variant: "whatsapp" },
	{
		label: "Knowledge Base",
		href: "/knowledge-base",
		icon: BookOpen,
		variant: "whatsapp",
	},
	{
		label: "WA Lines",
		href: "/wa-settings",
		icon: Smartphone,
		variant: "whatsapp",
	},
];

function withOutlet(
	items: SidebarNavItemData[],
	outletCode: string,
): SidebarNavItemData[] {
	return items.map((it) => ({ ...it, href: outletPath(outletCode, it.href) }));
}

function brandInitials(name: string, nickname: string | null | undefined) {
	const source = (nickname ?? "").trim() || name.trim();
	if (!source) return "BIG";
	const words = source.split(/\s+/).filter(Boolean);
	if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
	return (words[0][0] + words[1][0]).toUpperCase();
}

export function AppSidebar({
	outletCode,
	brandName,
	brandNickname,
	brandLogoUrl,
}: {
	outletCode: string;
	brandName: string;
	brandNickname: string | null;
	brandLogoUrl: string | null;
}) {
	const pathname = usePathname();
	const [pendingHref, setPendingHref] = useState<string | null>(null);

	useEffect(() => {
		setPendingHref(null);
	}, [pathname]);

	const handlePending = useCallback((href: string) => {
		setPendingHref(href);
	}, []);

	const navItems = useMemo(
		() => withOutlet(baseNavItems, outletCode),
		[outletCode],
	);
	const whatsappNavItems = useMemo(
		() => withOutlet(baseWhatsappNavItems, outletCode),
		[outletCode],
	);

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="border-sidebar-border border-b">
				<div className="flex min-h-12 items-center gap-2 py-2">
					<SidebarTrigger className="hidden size-9 shrink-0 md:flex" />
					{brandLogoUrl ? (
						// biome-ignore lint/performance/noImgElement: tenant-uploaded logo, sized fixed; next/image adds little here
						<img
							src={brandLogoUrl}
							alt={brandName}
							className="size-8 shrink-0 rounded-lg object-cover shadow-sm group-data-[collapsible=icon]:hidden"
						/>
					) : (
						<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-sky-500 font-bold text-primary-foreground text-xs shadow-sm group-data-[collapsible=icon]:hidden">
							{brandInitials(brandName, brandNickname)}
						</div>
					)}
					<span className="truncate font-bold text-lg text-primary group-data-[collapsible=icon]:hidden">
						{brandName}
					</span>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup className="px-2 py-3">
					<SidebarGroupContent>
						<SidebarMenu className="gap-0.5">
							{navItems.map((item) => (
								<SidebarNavItem
									key={item.href}
									item={item}
									pendingHref={pendingHref}
									onPending={handlePending}
								/>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup className="border-sidebar-border border-t px-2 py-3">
					<SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
						WhatsApp
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="gap-0.5">
							{whatsappNavItems.map((item) => (
								<SidebarNavItem
									key={item.href}
									item={item}
									pendingHref={pendingHref}
									onPending={handlePending}
								/>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-sidebar-border border-t">
				<div className="px-3 py-2 text-[11px] text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
					BIG App v1.0.0
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
