// Shared utilities for "use server" action files.
//
// `toErr` is the convention from feedback_action_error_handling.md:
// every write action wraps its body in try/catch and returns
// `{ error: string } | T` instead of throwing. Throwing causes Next.js to
// sanitize the message in production to "An error occurred in the Server
// Components render" — meaningless to users, who then think the app is
// broken. Wrapping preserves the real message all the way to the form.
//
// Usage:
//   try {
//     ...
//     return result;
//   } catch (err) {
//     return toErr("[createFooAction]", err);
//   }

export function toErr(prefix: string, err: unknown): { error: string } {
	console.error(prefix, err);
	return {
		error: err instanceof Error ? err.message : "Something went wrong",
	};
}
