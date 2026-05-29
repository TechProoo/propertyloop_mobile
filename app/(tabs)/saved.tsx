import { TabPlaceholder } from "@/components/brand/TabPlaceholder";

export default function SavedScreen() {
  return (
    <TabPlaceholder
      icon="heart"
      eyebrow="SAVED"
      title="Your shortlist,"
      italic="all in one place."
      body="Tap the heart on any listing to save it. We'll alert you when prices drop or new viewings open up."
    />
  );
}
