// Agents share the same inbox UX as buyers — re-export the buyer tab.
// Conversation rows + thread already work for both roles since mocks/inbox
// returns generic thread data.
export { default } from "../(tabs)/inbox";
