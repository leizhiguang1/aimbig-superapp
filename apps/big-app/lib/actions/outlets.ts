"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { getServerContext } from "@/lib/context/server";
import * as outletsService from "@/lib/services/outlets";

export async function listRoomsAction(outletId: string) {
	const ctx = await getServerContext();
	return outletsService.listRooms(ctx, outletId);
}

export type OutletActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof outletsService.createOutlet>>;

export async function createOutletAction(
	input: unknown,
): Promise<OutletActionResult> {
	try {
		const ctx = await getServerContext();
		const outlet = await outletsService.createOutlet(ctx, input);
		revalidatePath("/o/[outlet]/config/outlets", "page");
		return outlet;
	} catch (err) {
		return toErr("[createOutletAction]", err);
	}
}

export async function updateOutletAction(
	id: string,
	input: unknown,
): Promise<OutletActionResult> {
	try {
		const ctx = await getServerContext();
		const outlet = await outletsService.updateOutlet(ctx, id, input);
		revalidatePath("/o/[outlet]/config/outlets", "page");
		revalidatePath(`/o/[outlet]/config/outlets/${id}`, "page");
		return outlet;
	} catch (err) {
		return toErr("[updateOutletAction]", err);
	}
}

export async function setOutletTimezoneAction(
	input: unknown,
): Promise<OutletActionResult> {
	try {
		const ctx = await getServerContext();
		const outlet = await outletsService.setOutletTimezone(ctx, input);
		revalidatePath("/o/[outlet]/config/general", "page");
		return outlet;
	} catch (err) {
		return toErr("[setOutletTimezoneAction]", err);
	}
}

export async function deleteOutletAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await outletsService.deleteOutlet(ctx, id);
		revalidatePath("/o/[outlet]/config/outlets", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteOutletAction]", err);
	}
}

export type RoomActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof outletsService.createRoom>>;

export async function createRoomAction(
	outletId: string,
	input: unknown,
): Promise<RoomActionResult> {
	try {
		const ctx = await getServerContext();
		const room = await outletsService.createRoom(ctx, outletId, input);
		revalidatePath("/o/[outlet]/config/outlets", "page");
		revalidatePath(`/o/[outlet]/config/outlets/${outletId}`, "page");
		return room;
	} catch (err) {
		return toErr("[createRoomAction]", err);
	}
}

export async function updateRoomAction(
	outletId: string,
	roomId: string,
	input: unknown,
): Promise<RoomActionResult> {
	try {
		const ctx = await getServerContext();
		const room = await outletsService.updateRoom(ctx, roomId, input);
		revalidatePath(`/o/[outlet]/config/outlets/${outletId}`, "page");
		return room;
	} catch (err) {
		return toErr("[updateRoomAction]", err);
	}
}

export async function deleteRoomAction(
	outletId: string,
	roomId: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await outletsService.deleteRoom(ctx, roomId);
		revalidatePath(`/o/[outlet]/config/outlets/${outletId}`, "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteRoomAction]", err);
	}
}
