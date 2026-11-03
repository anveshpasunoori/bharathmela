import { configProblems } from "./lib/env";

// Runs once when the server starts: say loudly in the logs if production settings are missing.
export function register() {
  const { missing, warnings } = configProblems();
  if (missing.length) console.error(`[config] Missing required settings: ${missing.join(", ")}. See DEPLOY.md.`);
  for (const w of warnings) console.warn(`[config] ${w}`);
}

// Every failed request ends up in the host's logs with where it happened, as one line of JSON.
export function onRequestError(err: unknown, request: { path: string; method: string }, context: { routeType: string }) {
  const e = err as Error & { digest?: string };
  console.error(JSON.stringify({ level: "error", message: e.message, digest: e.digest, path: request.path, method: request.method, routeType: context.routeType, stack: e.stack?.split("\n").slice(0, 6).join(" | ") }));
}
