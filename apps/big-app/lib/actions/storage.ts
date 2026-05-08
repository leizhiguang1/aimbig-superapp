"use server";

import { toErr } from "@/lib/actions/_helpers";
import { type PermissionKey, requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import { ValidationError } from "@/lib/errors";
import {
	buildEntityPath,
	createSignedUploadUrl,
	deleteObject,
	type MediaEntity,
} from "@/lib/services/storage";

const ENTITY_PERMISSION: Record<MediaEntity, PermissionKey> = {
	employees: "staff.employees",
	customers: "customers.update",
	services: "services.services",
	outlets: "system.config",
	brands: "system.config",
	products: "inventory.inventory_edit",
};

function entityFromPath(path: string): MediaEntity {
	const first = path.split("/")[0];
	if (first && first in ENTITY_PERMISSION) return first as MediaEntity;
	throw new ValidationError(`Unrecognized media path: ${path}`);
}

export type RequestUploadUrlResult =
	| { error: string }
	| Awaited<ReturnType<typeof createSignedUploadUrl>>;

export async function requestMediaUploadUrlAction(args: {
	entity: MediaEntity;
	entityId: string;
	filename: string;
	mime: string;
}): Promise<RequestUploadUrlResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, ENTITY_PERMISSION[args.entity]);
		const path = buildEntityPath({
			entity: args.entity,
			entityId: args.entityId,
			filename: args.filename,
			mime: args.mime,
		});
		return await createSignedUploadUrl(ctx, "media", path);
	} catch (err) {
		return toErr("[requestMediaUploadUrlAction]", err);
	}
}

export async function deleteMediaObjectAction(
	path: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, ENTITY_PERMISSION[entityFromPath(path)]);
		await deleteObject(ctx, "media", path);
		return { ok: true };
	} catch (err) {
		return toErr("[deleteMediaObjectAction]", err);
	}
}
