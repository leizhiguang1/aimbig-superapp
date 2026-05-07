"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import * as employeesService from "@/lib/services/employees";
import type { Employee } from "@/lib/services/employees";

export type EmployeeActionResult = { error: string } | Employee;

export async function createEmployeeAction(
	input: unknown,
	password?: string,
	pin?: string,
): Promise<EmployeeActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.employees");
		const employee = await employeesService.createEmployee(ctx, input, password, pin);
		revalidatePath("/o/[outlet]/employees", "page");
		return employee;
	} catch (err) {
		return toErr("[createEmployeeAction]", err);
	}
}

export async function updateEmployeeAction(
	id: string,
	input: unknown,
	password?: string,
	pin?: string,
): Promise<EmployeeActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.employees");
		const employee = await employeesService.updateEmployee(ctx, id, input, password, pin);
		revalidatePath("/o/[outlet]/employees", "page");
		return employee;
	} catch (err) {
		return toErr("[updateEmployeeAction]", err);
	}
}

export async function deleteEmployeeAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.employees");
		await employeesService.deleteEmployee(ctx, id);
		revalidatePath("/o/[outlet]/employees", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteEmployeeAction]", err);
	}
}

/** Returns a password-reset link the admin can copy and share. */
export type ResetPasswordResult = { error: string } | { link: string };

export async function resetPasswordAction(
	employeeId: string,
): Promise<ResetPasswordResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.employees");
		const headersList = await headers();
		const origin = headersList.get("origin") ?? "";
		const link = await employeesService.generatePasswordResetLink(
			ctx,
			employeeId,
			origin,
		);
		return { link };
	} catch (err) {
		return toErr("[resetPasswordAction]", err);
	}
}

export type AdminSetPasswordResult = { error: string } | { ok: true };

export async function adminSetPasswordAction(
	employeeId: string,
	newPassword: string,
): Promise<AdminSetPasswordResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.employees");
		await employeesService.adminSetPassword(ctx, employeeId, newPassword);
		return { ok: true };
	} catch (err) {
		return toErr("[adminSetPasswordAction]", err);
	}
}

export type AdminSetPinResult = { error: string } | { ok: true };

export async function adminSetPinAction(
	employeeId: string,
	newPin: string,
): Promise<AdminSetPinResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.employees");
		await employeesService.adminSetPin(ctx, employeeId, newPin);
		return { ok: true };
	} catch (err) {
		return toErr("[adminSetPinAction]", err);
	}
}

export type ChangeEmailResult = { error: string } | { ok: true };

export async function changeOwnEmailAction(
	newEmail: string,
): Promise<ChangeEmailResult> {
	try {
		const ctx = await getServerContext();
		await employeesService.changeOwnEmail(ctx, newEmail);
		revalidatePath("/", "layout");
		return { ok: true };
	} catch (err) {
		return toErr("[changeOwnEmailAction]", err);
	}
}

export type ChangePasswordResult = { error: string } | { ok: true };

export async function changeOwnPasswordAction(
	newPassword: string,
): Promise<ChangePasswordResult> {
	try {
		const ctx = await getServerContext();
		await employeesService.changeOwnPassword(ctx, newPassword);
		return { ok: true };
	} catch (err) {
		return toErr("[changeOwnPasswordAction]", err);
	}
}

export async function verifyPinAction(
	employeeId: string,
	pin: string,
): Promise<boolean> {
	try {
		const ctx = await getServerContext();
		return await employeesService.verifyPin(ctx, employeeId, pin);
	} catch (err) {
		console.error("[verifyPinAction]", err);
		return false;
	}
}

export type ChangePinResult = { error: string } | { ok: true };

export async function changeOwnPinAction(
	newPin: string,
): Promise<ChangePinResult> {
	try {
		const ctx = await getServerContext();
		await employeesService.changeOwnPin(ctx, newPin);
		return { ok: true };
	} catch (err) {
		return toErr("[changeOwnPinAction]", err);
	}
}
