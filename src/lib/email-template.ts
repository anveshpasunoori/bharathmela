// Turns a plain-text email into a branded HTML version, so every email looks the same without each one
// being written twice. Conventions in the text:
//   "Label: https://…" on its own line  → a button (the first one) or a link
//   "• item" lines                       → a list
//   blank line                           → new paragraph; "– BharathMela" at the end → the sign-off
// Email clients ignore most CSS, so this uses tables and inline styles only.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'])/g;
const linkify = (s: string) => esc(s).replace(URL_RE, (u) => `<a href="${u}" style="color:${BRAND};text-decoration:underline;">${u}</a>`);

// The site's forest green (buttons, links, the name) and its storefront pin logo.
const BRAND = "#145638";
const LOGO_URL = `${(process.env.APP_URL ?? "https://www.bharathmela.com").replace(/\/$/, "")}/apple-icon.png`;
const button = (label: string, url: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td style="background:${BRAND};border-radius:8px;">` +
  `<a href="${esc(url)}" style="display:inline-block;padding:11px 20px;color:#ffffff;font-weight:600;text-decoration:none;font-size:15px;">${esc(label)}</a>` +
  `</td></tr></table>`;
const textLink = (label: string, url: string) =>
  `<a href="${esc(url)}" style="color:${BRAND};font-weight:600;text-decoration:none;">${esc(label)} →</a>`;

export function renderEmailHtml(subject: string, text: string, footer = "") {
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  let buttons = 0;
  const html = blocks
    .map((block) => {
      const lines = block.split("\n");
      if (lines.length === 1 && /^[–-] ?BharathMela$/.test(lines[0].trim())) {
        return `<p style="margin:20px 0 0;color:#57534e;">– The BharathMela team</p>`;
      }
      // Bullet lists (continuation lines stay with their item).
      if (lines[0].startsWith("• ")) {
        const items: string[] = [];
        for (const l of lines) {
          if (l.startsWith("• ")) items.push(linkify(l.slice(2)));
          else items[items.length - 1] += `<br><span style="color:#57534e;font-size:14px;">${linkify(l.trim())}</span>`;
        }
        return `<ul style="margin:0 0 16px;padding-left:20px;">${items.map((i) => `<li style="margin:0 0 10px;">${i}</li>`).join("")}</ul>`;
      }
      return lines
        .map((l) => {
          const action = l.match(/^([^:]{2,60}):\s+(https?:\/\/\S+)$/);
          if (action) return buttons++ === 0 ? button(action[1], action[2]) : `<p style="margin:6px 0;">${textLink(action[1], action[2])}</p>`;
          return null;
        })
        .reduce<string[]>((out, rendered, i) => {
          if (rendered) out.push(rendered);
          else {
            // Join consecutive plain lines into one paragraph with line breaks.
            const prev = out[out.length - 1];
            const line = linkify(lines[i]);
            if (prev?.startsWith("<p data-text>")) out[out.length - 1] = prev.replace(/<\/p>$/, `<br>${line}</p>`);
            else out.push(`<p data-text>${line}</p>`);
          }
          return out;
        }, [])
        .join("")
        .replace(/<p data-text>/g, '<p style="margin:0 0 16px;">');
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#faf8f2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f2;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 4px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="width:32px;height:32px;"><img src="${LOGO_URL}" width="32" height="32" alt="" style="display:block;border:0;border-radius:7px;"></td>
<td style="padding-left:10px;font:700 18px Helvetica,Arial,sans-serif;color:${BRAND};">BharathMela</td>
</tr></table></td></tr>
<tr><td style="background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;padding:28px 24px;font:15px/1.55 Helvetica,Arial,sans-serif;color:#1c1917;">${html}</td></tr>
<tr><td style="padding:16px 8px;font:12px/1.5 Helvetica,Arial,sans-serif;color:#78716c;text-align:center;">
BharathMela connects you with independent local sellers. We never ask for passwords or payments by email.${footer ? `<br>${esc(footer)}` : ""}
</td></tr>
</table></td></tr></table></body></html>`;
}
