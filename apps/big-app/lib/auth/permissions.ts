import { cache } from "react";
import type { Context } from "@/lib/context/types";
import { UnauthorizedError } from "@/lib/errors";
import {
	PERMISSION_SECTIONS,
	type PermissionSectionKey,
	type RolePermissions,
	normalizePermissions,
} from "@/lib/schemas/role-permissions";

type SectionOf<K extends PermissionSectionKey> = Extract<
	(typeof PERMISSION_SECTIONS)[number],
	{ key: K }
>;
type FlagsOf<K extends PermissionSectionKey> =
	SectionOf<K>["flags"][number]["key"];

export type PermissionKey = {
	[K in PermissionSectionKey]: `${K}.${FlagsOf<K>}`;
}[PermissionSectionKey];

export function checkPermission(
	perms: RolePermissions | null,
	key: PermissionKey,
): boolean {
	if (!perms) return false;
	if (perms.all) return true;
	const [section, flag] = key.split(".") as [PermissionSectionKey, string];
	const bucket = perms[section] as Record<string, boolean> | undefined;
	return Boolean(bucket?.[flag]);
}

export const getCurrentUserPermissions = cache(
	async (ctx: Context): Promise<RolePermissions | null> => {
		if (!ctx.currentUser?.employeeId) return null;
		const { data } = await ctx.dbAdmin
			.from("employees")
			.select("roles:role_id ( permissions, is_active )")
			.eq("id", ctx.currentUser.employeeId)
			.maybeSingle();
		const role = data?.roles as
			| { permissions: unknown; is_active: boolean | null }
			| null;
		if (!role || role.is_active === false) return null;
		return normalizePermissions(role.permissions);
	},
);

export async function hasPermission(
	ctx: Context,
	key: PermissionKey,
): Promise<boolean> {
	const perms = await getCurrentUserPermissions(ctx);
	return checkPermission(perms, key);
}

export async function requirePermission(
	ctx: Context,
	key: PermissionKey,
): Promise<void> {
	if (!ctx.currentUser) throw new UnauthorizedError("Not logged in");
	if (!(await hasPermission(ctx, key))) {
		throw new UnauthorizedError(`Missing permission: ${key}`);
	}
}
