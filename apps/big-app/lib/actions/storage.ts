"use server";

import { toErr } from "@/lib/actions/_helpers";
import { getServerContext } from "@/lib/context/server";
import {
	buildEntityPath,
	createSignedUploadUrl,
	deleteObject,
	type MediaEntity,
} from "@/lib/services/storage";

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
		await deleteObject(ctx, "media", path);
		return { ok: true };
	} catch (err) {
		return toErr("[deleteMediaObjectAction]", err);
	}
}
