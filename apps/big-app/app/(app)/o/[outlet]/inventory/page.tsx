import { InventoryContent } from "./inventory-content";

export default function InventoryPage({
	params,
}: {
	params: Promise<{ outlet: string }>;
}) {
	return <InventoryContent params={params} />;
}
