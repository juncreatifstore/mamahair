/**
 * Intégration Sentry optionnelle. Sans SENTRY_DSN, tout est no-op.
 * Pour activer : npm i @sentry/nextjs, définir SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN,
 * et compléter `instrumentation.ts` (déjà prêt) — voir README.
 */
type SentryLike = { captureException: (e: unknown, ctx?: unknown) => void; init: (o: unknown) => void };
let sentry: SentryLike | null = null;
let attempted = false;

async function load(): Promise<SentryLike | null> {
  if (attempted) return sentry;
  attempted = true;
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;
  try {
    // Import dynamique par nom de module calculé : le build n'échoue pas si le paquet est absent.
    const name = "@sentry/nextjs";
    const mod = (await import(/* webpackIgnore: true */ name)) as SentryLike;
    mod.init({ dsn, tracesSampleRate: 0.1, environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV });
    sentry = mod;
  } catch {
    sentry = null;
  }
  return sentry;
}

export function captureException(err: unknown, extra?: Record<string, unknown>) {
  void load().then((s) => s?.captureException(err, extra ? { extra } : undefined));
}
