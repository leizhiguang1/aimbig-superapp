import { BrandSettingField } from "@/components/brand-config/BrandSettingField";
import { SettingToggleRow } from "@/components/config/SettingToggleRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerContext } from "@/lib/context/server";
import { listBrandSettings } from "@/lib/services/brand-settings";

export async function SettingsTab() {
	const ctx = await getServerContext();
	const settings = await listBrandSettings(ctx, { group: "appointment" });

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Active</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<BrandSettingField
						settingKey="appointment.hide_value_on_hover"
						value={settings["appointment.hide_value_on_hover"]}
					/>
				</CardContent>
			</Card>

			<Card className="border-dashed bg-muted/30">
				<CardHeader className="pb-2">
					<CardTitle className="text-base text-muted-foreground">
						Coming soon
					</CardTitle>
					<p className="text-muted-foreground text-xs">
						Listed for visibility — these activate as features ship.
					</p>
				</CardHeader>
				<CardContent className="space-y-2">
					<BrandSettingField
						settingKey="appointment.default_slot_minutes"
						value={settings["appointment.default_slot_minutes"]}
						disabled
					/>
					<BrandSettingField
						settingKey="appointment.allow_overbook"
						value={settings["appointment.allow_overbook"]}
						disabled
					/>
					<BrandSettingField
						settingKey="appointment.booking_lead_hours"
						value={settings["appointment.booking_lead_hours"]}
						disabled
					/>
					<BrandSettingField
						settingKey="appointment.enable_pin"
						value={settings["appointment.enable_pin"]}
						disabled
					/>
					<BrandSettingField
						settingKey="appointment.disable_sounds"
						value={settings["appointment.disable_sounds"]}
						disabled
					/>

					<SettingToggleRow
						label="Allow the selection of employees for Hands-On Incentive calculations"
						hint="Lets staff assign multiple employees to an appointment for incentive tracking."
						defaultChecked
						disabled
					/>
					<SettingToggleRow
						label="Enable selection of branch in Appointments"
						hint="Shows a branch/outlet selector when creating or editing appointments."
						defaultChecked
						disabled
					/>
					<SettingToggleRow
						label="Fit appointment columns to single screen"
						hint="Compresses the calendar view so all employee columns fit without horizontal scrolling."
						defaultChecked
						disabled
					/>
					<SettingToggleRow
						label="Hide appointments from all outlets"
						hint="Restricts each user to see only appointments from their own outlet."
						disabled
					/>
					<SettingToggleRow
						label="Hide customer's Address in Appointments"
						hint="Removes the address field from the appointment detail view."
						disabled
					/>
				</CardContent>
			</Card>
		</div>
	);
}
