import type { StatusSound } from "@/lib/constants/appointment-notifications";

const STATUS_SOUNDS: Record<NonNullable<StatusSound>, string> = {
	pending:   "/sounds/pending.wav",
	confirmed: "/sounds/confirmed.wav",
	arrived:   "/sounds/arrived.wav",
	started:   "/sounds/started.wav",
	billing:   "/sounds/billing.wav",
	noshow:    "/sounds/noshow.wav",
	cancelled: "/sounds/cancelled.wav",
	completed: "/sounds/completed.wav",
};

// Preload all audio objects once so playback is instant (no fetch delay on trigger)
const cache: Partial<Record<NonNullable<StatusSound>, HTMLAudioElement>> = {};

function preload() {
	if (typeof window === "undefined") return;
	for (const [key, src] of Object.entries(STATUS_SOUNDS) as [NonNullable<StatusSound>, string][]) {
		const audio = new Audio(src);
		audio.preload = "auto";
		cache[key] = audio;
	}
}

if (typeof window !== "undefined") {
	preload();
}

export function playStatusSound(sound: StatusSound) {
	if (!sound) return;
	const audio = cache[sound];
	if (!audio) return;
	// Rewind in case the same sound fires twice in quick succession
	audio.currentTime = 0;
	audio.play().catch(() => {});
}
