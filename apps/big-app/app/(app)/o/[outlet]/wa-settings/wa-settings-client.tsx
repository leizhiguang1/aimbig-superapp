"use client";

import { useEffect, useState } from "react";
import { ChatStaffPanel } from "@/components/wa-settings/ChatStaffPanel";
import { DeveloperPanel } from "@/components/wa-settings/DeveloperPanel";
import { NotificationsPanel } from "@/components/wa-settings/NotificationsPanel";
import { StatusManagerPanel } from "@/components/wa-settings/StatusManagerPanel";
import { TagManagerPanel } from "@/components/wa-settings/TagManagerPanel";
import { WALinesPanel } from "@/components/wa-settings/WALinesPanel";
import { useMultiWA } from "@/components/chats/useMultiWA";
import { WA_CRM_URL } from "@/lib/wa-client";
import type { CrmContact, WATeamMember } from "@aimbig/wa-client";

function teamKey(outletId: string) {
	return `wa_team_members_${outletId}`;
}

function loadTeam(outletId: string): WATeamMember[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(teamKey(outletId));
		return raw ? (JSON.parse(raw) as WATeamMember[]) : [];
	} catch {
		return [];
	}
}

function saveTeam(outletId: string, team: WATeamMember[]) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(teamKey(outletId), JSON.stringify(team));
	} catch {}
}

export function WaSettingsClient({ outletId }: { outletId: string }) {
	const {
		accounts,
		statusPerAccount,
		qrPerAccount,
		addAccount,
		updateAccount,
		removeAccount,
		requestQR,
		logoutAccount,
		getPrimarySocket,
	} = useMultiWA({ projectId: outletId });

	const [team, setTeam] = useState<WATeamMember[]>(() => loadTeam(outletId));
	const [contacts, setContacts] = useState<CrmContact[]>([]);

	useEffect(() => {
		const sock = getPrimarySocket();
		if (!sock) return;
		const onConnect = () => {
			sock.emit("get_crm", (list: CrmContact[]) => {
				if (Array.isArray(list)) setContacts(list);
			});
		};
		const onCrmUpdate = (list: CrmContact[]) => {
			if (Array.isArray(list)) setContacts(list);
		};
		sock.on("connect", onConnect);
		sock.on("crm_update", onCrmUpdate);
		if (sock.connected) onConnect();
		return () => {
			sock.off("connect", onConnect);
			sock.off("crm_update", onCrmUpdate);
		};
	}, [getPrimarySocket, outletId]);

	const handleAddTeam = (name: string) => {
		const next = [...team, { id: `m-${Date.now()}`, name }];
		setTeam(next);
		saveTeam(outletId, next);
	};

	const handleRemoveTeam = (id: string) => {
		const next = team.filter((m) => m.id !== id);
		setTeam(next);
		saveTeam(outletId, next);
	};

	const handleRenameTag = (oldTag: string, newTag: string) => {
		getPrimarySocket()?.emit("rename_crm_tag", { oldTag, newTag });
	};

	const handleDeleteTag = (tag: string) => {
		getPrimarySocket()?.emit("delete_crm_tag", { tag });
	};

	return (
		<div className="flex flex-col gap-4">
			<NotificationsPanel />
			<WALinesPanel
				accounts={accounts}
				statusPerAccount={statusPerAccount}
				qrPerAccount={qrPerAccount}
				onAddAccount={addAccount}
				onUpdateAccount={updateAccount}
				onRemoveAccount={removeAccount}
				onRequestQR={requestQR}
				onLogoutAccount={logoutAccount}
				projectBackendUrl={WA_CRM_URL}
			/>
			<ChatStaffPanel
				members={team}
				onAdd={handleAddTeam}
				onRemove={handleRemoveTeam}
			/>
			<TagManagerPanel
				contacts={contacts}
				onRenameTag={handleRenameTag}
				onDeleteTag={handleDeleteTag}
			/>
			<StatusManagerPanel />
			<DeveloperPanel />
		</div>
	);
}
