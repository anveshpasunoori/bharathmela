// Tells Bing (and the other IndexNow search engines: Yandex, Seznam, Naver; Bing also feeds DuckDuckGo,
// Yahoo and ChatGPT search) about every page in the live sitemap, so new and changed pages get crawled
// within hours instead of weeks. Run after a deploy that adds or changes public pages:
//
//   npm run indexnow                      every URL in https://www.bharathmela.com/sitemap.xml
//   npm run indexnow -- /about /in/dallas just these paths
//
// The key isn't a secret: IndexNow checks it by fetching /<key>.txt from the site (public/<key>.txt).
const KEY = "f033ddb7f90e2d2f5a38943dcac6ef7c";
const HOST = "www.bharathmela.com";
const SITE = `https://${HOST}`;

const paths = process.argv.slice(2);
let urls;
if (paths.length) urls = paths.map((p) => new URL(p, SITE).href);
else {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
}
if (!urls.length) {
  console.error("No URLs to submit.");
  process.exit(1);
}
// IndexNow takes up to 10,000 URLs per request.
for (let i = 0; i < urls.length; i += 10_000) {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls.slice(i, i + 10_000) }),
  });
  // 200 and 202 both mean accepted; 403 means the key file isn't live yet (deploy first).
  console.log(`Submitted ${Math.min(10_000, urls.length - i)} URLs: ${res.status} ${res.statusText}`);
  if (!res.ok) process.exitCode = 1;
}
