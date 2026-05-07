"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import * as rolesService from "@/lib/services/roles";

export type RoleActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof rolesService.createRole>>;

export async function createRoleAction(
	input: unknown,
): Promise<RoleActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.roles");
		const role = await rolesService.createRole(ctx, input);
		revalidatePath("/o/[outlet]/employees/roles", "page");
		return role;
	} catch (err) {
		return toErr("[createRoleAction]", err);
	}
}

export async function updateRoleAction(
	id: string,
	input: unknown,
): Promise<RoleActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.roles");
		const role = await rolesService.updateRole(ctx, id, input);
		revalidatePath("/o/[outlet]/employees/roles", "page");
		return role;
	} catch (err) {
		return toErr("[updateRoleAction]", err);
	}
}

export async function deleteRoleAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.roles");
		await rolesService.deleteRole(ctx, id);
		revalidatePath("/o/[outlet]/employees/roles", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteRoleAction]", err);
	}
}
