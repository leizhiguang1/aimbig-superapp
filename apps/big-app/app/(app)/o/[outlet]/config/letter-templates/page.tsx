import { getServerContext } from "@/lib/context/server";
import { listLetterTemplates } from "@/lib/services/letter-templates";
import { LetterTemplatesManager } from "@/components/config/letter-templates/LetterTemplatesManager";

export default async function LetterTemplatesPage() {
	const ctx = await getServerContext();
	const templates = await listLetterTemplates(ctx);
	return <LetterTemplatesManager templates={templates} />;
}
