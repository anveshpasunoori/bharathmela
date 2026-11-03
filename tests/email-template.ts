// Run with `npm test`. Checks the plain-text-to-HTML email conversion.
import { renderEmailHtml } from "../src/lib/email-template";

let fail = 0;
const check = (name: string, ok: boolean) => {
  if (!ok) fail++;
  console.log(ok ? "PASS" : "FAIL", name);
};

const html = renderEmailHtml(
  "1 new on BharathMela",
  `Hi Shreya,\n\nNew listings match your saved search "Rooms <under> $1,000":\n\n• Furnished room – $850 per month\n  Naveen R · http://localhost:3000/listing/abc-room\n\nSee them all: http://localhost:3000/?category=ROOM_RENTAL&ss=1\nStop these emails: http://localhost:3000/alerts/unsubscribe/tok\n\n– BharathMela`,
  "123 Main St, Jacksonville, FL",
);
check("first action line is a button", /background:#c2410c;border-radius:8px;"><a href="http:\/\/localhost:3000\/\?category=ROOM_RENTAL&amp;ss=1"[^>]*>See them all</.test(html));
check("later action lines are links", html.includes(">Stop these emails →</a>"));
check("bullets become a list with the detail line", html.includes("<li") && html.includes("Naveen R · <a href=\"http://localhost:3000/listing/abc-room\""));
check("text is escaped", html.includes("Rooms &lt;under&gt; $1,000") && !html.includes("<under>"));
check("sign-off", html.includes("The BharathMela team"));
check("footer address", html.includes("123 Main St, Jacksonville, FL"));
const plain = renderEmailHtml("Code", "Your code is 123456.\nIt expires in 15 minutes.");
check("plain lines join into one paragraph", plain.includes("Your code is 123456.<br>It expires in 15 minutes."));

console.log(fail ? `${fail} failed` : "all passed");
if (fail) process.exit(1);
