import { TabPlaceholder } from "@/components/brand/TabPlaceholder";

export default function AccountScreen() {
  return (
    <TabPlaceholder
      icon="person"
      eyebrow="ACCOUNT"
      title="Your profile,"
      italic="settings & history."
      body="Saved searches, viewings, vendor jobs and verification status all live here."
    />
  );
}
