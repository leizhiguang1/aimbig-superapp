"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";
import {
	checkPermission,
	type PermissionKey,
} from "@/lib/auth/permissions";
import type { RolePermissions } from "@/lib/schemas/role-permissions";

type Ctx = {
	perms: RolePermissions | null;
};

const PermissionsCtx = createContext<Ctx | null>(null);

export function PermissionsProvider({
	permissions,
	children,
}: {
	permissions: RolePermissions | null;
	children: ReactNode;
}) {
	const value = useMemo<Ctx>(() => ({ perms: permissions }), [permissions]);
	return (
		<PermissionsCtx.Provider value={value}>{children}</PermissionsCtx.Provider>
	);
}

// Returns false when no provider is present (isolated screens, tests).
// In normal app rendering the [outlet] layout always provides a value.
export function usePermission(key: PermissionKey): boolean {
	const ctx = useContext(PermissionsCtx);
	return checkPermission(ctx?.perms ?? null, key);
}
