import { getServerContext } from "@/lib/context/server";
import { listLetterTemplates } from "@/lib/services/letter-templates";
import { listFormTemplates } from "@/lib/services/form-templates";
import { EDocumentsManager } from "@/components/config/e-documents/EDocumentsManager";

export default async function EDocumentsPage() {
	const ctx = await getServerContext();
	const [letterTemplates, formTemplates] = await Promise.all([
		listLetterTemplates(ctx),
		listFormTemplates(ctx),
	]);
	return <EDocumentsManager letterTemplates={letterTemplates} formTemplates={formTemplates} />;
}
