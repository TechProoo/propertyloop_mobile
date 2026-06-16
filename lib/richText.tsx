import { Text, type StyleProp, type TextStyle, View } from "react-native";

/**
 * Renders the raw HTML produced by the website's React Quill editor as native
 * text. Descriptions are stored as HTML (e.g. "<p><strong>TO&nbsp;LET</strong></p>"),
 * so showing them in a plain <Text> would leak the markup. This converts the
 * markup into formatted React Native text without pulling in a heavy HTML engine.
 *
 * Supported: paragraphs / divs / headings (block breaks), <br>, <ul>/<ol> list
 * items (rendered as bullets), and inline <strong>/<b> + <em>/<i> emphasis.
 * Any other tags are stripped. HTML entities are decoded.
 */

type Run = { text: string; bold?: boolean; italic?: boolean };
type Block = { bullet: boolean; runs: Run[] };

// Sentinel marking a list item. Built from a control char so it can never
// collide with real description text; stripped before rendering.
const BULLET = String.fromCharCode(1);

const ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  bull: "•",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#?\w+);/g, (_, code: string) => {
    if (ENTITIES[code] != null) return ENTITIES[code];
    if (code[0] === "#") {
      const num =
        code[1] === "x" || code[1] === "X"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      if (Number.isFinite(num)) return String.fromCodePoint(num);
    }
    return " ";
  });
}

/** Parse HTML into a flat list of blocks, each with styled inline runs. */
export function parseHtml(html: string): Block[] {
  if (!html) return [];

  // Normalise block boundaries to newlines and list items to bullet markers.
  const s = html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, BULLET)
    .replace(/<\s*\/\s*(p|div|li|h[1-6]|ul|ol|blockquote|tr)\s*>/gi, "\n")
    .replace(/<\s*(p|div|h[1-6]|ul|ol|blockquote|tr)[^>]*>/gi, "\n");

  const blocks: Block[] = [];
  for (const rawLine of s.split("\n")) {
    const bullet = rawLine.includes(BULLET);
    const line = rawLine.split(BULLET).join("").trim();
    if (!line) continue;

    const runs: Run[] = [];
    let bold = 0;
    let italic = 0;
    const tagRe = /<\s*(\/?)\s*([a-zA-Z0-9]+)[^>]*>/g;
    let last = 0;
    let m: RegExpExecArray | null;

    const pushText = (chunk: string) => {
      const text = decodeEntities(chunk).replace(/[ \t\f\v]+/g, " ");
      if (text) runs.push({ text, bold: bold > 0, italic: italic > 0 });
    };

    while ((m = tagRe.exec(line)) !== null) {
      if (m.index > last) pushText(line.slice(last, m.index));
      const closing = m[1] === "/";
      const tag = m[2].toLowerCase();
      if (tag === "strong" || tag === "b") bold += closing ? -1 : 1;
      else if (tag === "em" || tag === "i") italic += closing ? -1 : 1;
      bold = Math.max(0, bold);
      italic = Math.max(0, italic);
      last = tagRe.lastIndex;
    }
    if (last < line.length) pushText(line.slice(last));

    const cleaned = runs.filter(
      (r) => r.text.trim().length > 0 || r.text === " ",
    );
    if (cleaned.length) blocks.push({ bullet, runs: cleaned });
  }
  return blocks;
}

export function RichText({
  html,
  style,
  boldStyle,
}: {
  html: string;
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
}) {
  const blocks = parseHtml(html);
  if (!blocks.length) return null;

  return (
    <View>
      {blocks.map((block, bi) => (
        <View
          key={bi}
          style={{ flexDirection: "row", marginTop: bi === 0 ? 0 : 8 }}
        >
          {block.bullet && <Text style={style}>{"•  "}</Text>}
          <Text style={[style, { flex: 1 }]}>
            {block.runs.map((run, ri) => (
              <Text
                key={ri}
                style={[
                  run.bold ? boldStyle : null,
                  run.italic ? { fontStyle: "italic" } : null,
                ]}
              >
                {run.text}
              </Text>
            ))}
          </Text>
        </View>
      ))}
    </View>
  );
}
