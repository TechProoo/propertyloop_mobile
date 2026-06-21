// Vendors share the buyer inbox UX, but drop the "Your" from the title when
// there are no conversations yet — so it reads "Conversations" / "Inbox".
import InboxScreen from "../(tabs)/inbox";

export default function VendorInboxScreen() {
  return <InboxScreen vendor />;
}
