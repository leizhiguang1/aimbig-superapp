"use client";

import { Check, Copy, Link as LinkIcon, RefreshCw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	adminSetPasswordAction,
	adminSetPinAction,
	resetPasswordAction,
} from "@/lib/actions/employees";
import type { EmployeeWithRelations } from "@/lib/services/employees";

type Props = {
	open: boolean;
	employee: EmployeeWithRelations | null;
	onClose: () => void;
};

function generatePassword(): string {
	const digits = Math.floor(10000 + Math.random() * 90000);
	return `Big${digits}`;
}

function generatePin(): string {
	return String(Math.floor(100000 + Math.random() * 900000));
}

export function ResetCredentialsDialog({ open, employee, onClose }: Props) {
	const [password, setPassword] = useState("");
	const [pin, setPin] = useState("");
	const [recoveryLink, setRecoveryLink] = useState<string | null>(null);
	const [linkCopied, setLinkCopied] = useState(false);
	const [pwMsg, setPwMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
	const [pinMsg, setPinMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
	const [linkMsg, setLinkMsg] = useState<string | null>(null);
	const [pwPending, startPwTransition] = useTransition();
	const [pinPending, startPinTransition] = useTransition();
	const [linkPending, startLinkTransition] = useTransition();

	useEffect(() => {
		if (open) {
			setPassword("");
			setPin("");
			setRecoveryLink(null);
			setLinkCopied(false);
			setPwMsg(null);
			setPinMsg(null);
			setLinkMsg(null);
		}
	}, [open]);

	if (!employee) return null;

	const hasAuth = !!employee.auth_user_id;
	const fullName = `${employee.first_name} ${employee.last_name}`.trim();

	const onSetPassword = () => {
		if (!hasAuth) return;
		setPwMsg(null);
		startPwTransition(async () => {
			const result = await adminSetPasswordAction(employee.id, password);
			if ("error" in result) {
				setPwMsg({ kind: "err", text: result.error });
				return;
			}
			setPwMsg({ kind: "ok", text: "Password updated." });
			setPassword("");
		});
	};

	const onGenerateLink = () => {
		if (!hasAuth) return;
		setLinkMsg(null);
		setRecoveryLink(null);
		setLinkCopied(false);
		startLinkTransition(async () => {
			const result = await resetPasswordAction(employee.id);
			if ("error" in result) {
				setLinkMsg(result.error);
				return;
			}
			setRecoveryLink(result.link);
		});
	};

	const onCopyLink = async () => {
		if (!recoveryLink) return;
		try {
			await navigator.clipboard.writeText(recoveryLink);
			setLinkCopied(true);
			setTimeout(() => setLinkCopied(false), 1800);
		} catch {
			setLinkMsg("Could not copy. Select and copy the link manually.");
		}
	};

	const onSetPin = () => {
		setPinMsg(null);
		startPinTransition(async () => {
			const result = await adminSetPinAction(employee.id, pin);
			if ("error" in result) {
				setPinMsg({ kind: "err", text: result.error });
				return;
			}
			setPinMsg({ kind: "ok", text: "PIN updated." });
			setPin("");
		});
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 p-0 sm:max-w-lg">
				<DialogHeader className="border-b p-4">
					<DialogTitle>Reset credentials</DialogTitle>
					<DialogDescription>
						{fullName} ({employee.code})
					</DialogDescription>
				</DialogHeader>

				<div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
					<section className="flex flex-col gap-3">
						<div className="flex items-baseline justify-between gap-2">
							<h3 className="font-semibold text-sm">Password</h3>
							{!hasAuth && (
								<span className="text-muted-foreground text-xs">
									Web login disabled — enable it in Edit first
								</span>
							)}
						</div>

						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="reset-pw"
								className="text-muted-foreground text-xs"
							>
								Set a new password
							</label>
							<div className="flex gap-1.5">
								<Input
									id="reset-pw"
									autoComplete="new-password"
									className="font-mono"
									placeholder="At least 8 characters"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									disabled={!hasAuth || pwPending}
								/>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="shrink-0"
											disabled={!hasAuth || pwPending}
											onClick={() => setPassword(generatePassword())}
											aria-label="Generate password"
										>
											<RefreshCw className="size-3.5" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Generate password</TooltipContent>
								</Tooltip>
								<Button
									type="button"
									onClick={onSetPassword}
									disabled={!hasAuth || pwPending || password.length < 8}
								>
									{pwPending ? "Saving…" : "Set"}
								</Button>
							</div>
							{pwMsg && (
								<p
									className={
										pwMsg.kind === "ok"
											? "text-emerald-600 text-xs"
											: "text-destructive text-xs"
									}
								>
									{pwMsg.text}
								</p>
							)}
						</div>

						<div className="flex flex-col gap-1.5 border-t pt-3">
							<label className="text-muted-foreground text-xs">
								Or generate a recovery link to share
							</label>
							<div className="flex gap-1.5">
								<Button
									type="button"
									variant="outline"
									onClick={onGenerateLink}
									disabled={!hasAuth || linkPending}
									className="gap-1.5"
								>
									<LinkIcon className="size-3.5" />
									{linkPending ? "Generating…" : "Generate link"}
								</Button>
								{recoveryLink && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												type="button"
												variant="outline"
												size="icon"
												onClick={onCopyLink}
												aria-label="Copy link"
											>
												{linkCopied ? (
													<Check className="size-3.5 text-emerald-600" />
												) : (
													<Copy className="size-3.5" />
												)}
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{linkCopied ? "Copied" : "Copy link"}
										</TooltipContent>
									</Tooltip>
								)}
							</div>
							{recoveryLink && (
								<Input
									readOnly
									value={recoveryLink}
									className="font-mono text-xs"
									onFocus={(e) => e.currentTarget.select()}
								/>
							)}
							{linkMsg && (
								<p className="text-destructive text-xs">{linkMsg}</p>
							)}
						</div>
					</section>

					<section className="flex flex-col gap-3 border-t pt-5">
						<h3 className="font-semibold text-sm">PIN</h3>
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="reset-pin"
								className="text-muted-foreground text-xs"
							>
								Set a new 6-digit PIN
							</label>
							<div className="flex gap-1.5">
								<Input
									id="reset-pin"
									inputMode="numeric"
									autoComplete="off"
									maxLength={6}
									className="font-mono"
									placeholder="6 digits"
									value={pin}
									onChange={(e) =>
										setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
									}
									disabled={pinPending}
								/>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="shrink-0"
											disabled={pinPending}
											onClick={() => setPin(generatePin())}
											aria-label="Generate PIN"
										>
											<RefreshCw className="size-3.5" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Generate PIN</TooltipContent>
								</Tooltip>
								<Button
									type="button"
									onClick={onSetPin}
									disabled={pinPending || pin.length !== 6}
								>
									{pinPending ? "Saving…" : "Set"}
								</Button>
							</div>
							{pinMsg && (
								<p
									className={
										pinMsg.kind === "ok"
											? "text-emerald-600 text-xs"
											: "text-destructive text-xs"
									}
								>
									{pinMsg.text}
								</p>
							)}
						</div>
					</section>
				</div>

				<DialogFooter className="border-t">
					<Button type="button" variant="outline" onClick={onClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
