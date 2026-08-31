/** Point d'entrée Next.js pour l'observabilité. Sentry est chargé uniquement si SENTRY_DSN est défini. */
export async function register() {
  if (!process.env.SENTRY_DSN) return;
  try {
    const name = "@sentry/nextjs";
    const Sentry = (await import(/* webpackIgnore: true */ name)) as { init: (o: unknown) => void };
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1, environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV });
  } catch {
    /* @sentry/nextjs non installé : ignoré */
  }
}
