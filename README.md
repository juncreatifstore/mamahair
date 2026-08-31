# MAMAHAIR.COM — plateforme e-commerce (Next.js 15)

Boutique premium de perruques, bundles, extensions, closures, frontals, soins et accessoires pour cheveux afro, bouclés et texturés.
Marchés : USA au lancement, puis Mexique, Haïti, République dominicaine, Canada, international.

**Stack** : Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma + PostgreSQL (Supabase) · Supabase Auth & Storage · Stripe Checkout + Stripe Tax · Resend · Vercel.

---

## 1. Installation locale

```bash
npm install
cp .env.example .env.local      # remplir toutes les variables (voir section 4)
npx prisma migrate deploy        # base neuve : applique prisma/migrations
npm run db:seed                  # paramètres, zones, catégories, 15 produits, pages, codes, compte admin
npm run dev                      # http://localhost:3000
```

Vérifications :
```bash
npm run typecheck      # tsc --noEmit
npm test               # tests unitaires (vitest)
npm run build          # prisma generate && next build
npm run test:e2e       # Playwright (base seedée + serveur dev)
```

Si vous aviez déjà une base issue de la version précédente (Nara Hair), utilisez `npx prisma migrate dev --name mamahair` : Prisma calculera le diff vers le nouveau schéma. La table `Order.status` change de valeurs (`PENDING` → `PENDING_PAYMENT`) ; sur une base contenant des commandes, migrez les valeurs avant d'appliquer l'enum.

---

## 2. Supabase

1. **Settings → Database** : `DATABASE_URL` (pooler, port 6543, `?pgbouncer=true`) et `DIRECT_URL` (port 5432).
2. **Settings → API** : URL, clé `anon`, clé `service_role` (serveur uniquement).
3. **SQL Editor** : exécuter `supabase/storage-policies.sql` → crée les buckets `products`, `reviews`, `branding` (lecture publique, écriture uniquement via le serveur ; limites de taille et types MIME).
4. **Authentication → Providers** : Email activé (confirmation d'email recommandée en production).
5. **Authentication → URL Configuration** : Site URL = domaine final ; Redirect URLs = `https://<domaine>/auth/callback`, `http://localhost:3000/auth/callback`.
6. Google / Apple : ajouter le provider dans Supabase ; le callback `/auth/callback` est déjà prêt.

## 3. Stripe

1. Clés API (test puis live) → `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. **Stripe Tax** : Settings → Tax → activer + adresse de l'entreprise. Sinon `STRIPE_TAX_ENABLED="false"` (et décocher dans Admin → Settings → Payments).
3. **Apple Pay / Google Pay** : Settings → Payment methods → activer (apparaissent automatiquement sur Stripe Checkout, domaine à vérifier pour Apple Pay).
4. **Webhook** : Developers → Webhooks → Add endpoint `https://<domaine>/api/webhooks/stripe`, événements :
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded` → secret dans `STRIPE_WEBHOOK_SECRET`.
5. Local : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

Le webhook est la seule autorité qui passe une commande en PAYÉE. La page de succès lit le statut en base et se rafraîchit tant que le webhook n'a pas confirmé.

## 4. Variables d'environnement

Voir `.env.example` (toutes documentées). Obligatoires : `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`. Optionnelles : `STRIPE_TAX_ENABLED`, `EMAIL_FROM_OVERRIDE`, `ABANDONED_CART_CODE`, `SENTRY_DSN`, `SEED_ADMIN_*`, `E2E_ADMIN_*`.

## 5. Déploiement Vercel

1. Pousser sur GitHub, importer dans Vercel (framework Next.js détecté).
2. Coller les variables d'environnement (Production + Preview), clés Stripe **live** en production.
3. Build command par défaut : `npm run build` (= `prisma generate && next build`). Pour appliquer les migrations à chaque déploiement, mettre la build command à `npx prisma migrate deploy && npm run build`.
4. `vercel.json` déclare les crons : `/api/cron/expire-reservations` (toutes les 15 min, libère le stock des commandes non payées) et `/api/cron/abandoned-carts` (toutes les 6 h). Vercel envoie `Authorization: Bearer $CRON_SECRET`.
5. Créer le webhook Stripe de production, mettre à jour `STRIPE_WEBHOOK_SECRET`, redéployer.
6. Domaine + HTTPS ; vérifier le domaine dans Resend et pour Apple Pay.

## 6. Administration

URL : `/admin` (rôles `ADMIN` et `STAFF`, vérifiés côté serveur).
Compte initial : créé par `npm run db:seed` avec `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (Supabase Auth + rôle ADMIN en base). Pour promouvoir un autre utilisateur : `update "User" set role = 'ADMIN' where email = '...';`

Sections : Dashboard (ventes jour/semaine/mois, panier moyen, nouveaux clients, graphique 30 jours, stock faible/rupture, best sellers, remboursements, avis en attente), Orders (recherche, filtres, timeline, notes internes, tracking, remboursement partiel/total, impression, email), Products (General / Hair attributes / Pricing & inventory / Shipping / SEO, médias multiples avec type et réorganisation, variantes combinatoires + générateur, composants de bundle, dupliquer / publier / masquer / archiver, catégories avec image), Customers (fiche, notes, blocage), Reviews (modération), Discounts (pourcentage, fixe avec devise, livraison offerte, minimum, quotas, dates, catégories/produits), Shipping & tax (zones, tarifs par devise et poids, taxes d'estimation), Abandoned carts, Content (blocs de l'accueil par langue, pages par langue), Settings (General, Branding, Contact, Social, Commerce, Payments, Shipping, Email, SEO, Localization, Policies).

## 7. Architecture

```
prisma/schema.prisma           modèle (produits + attributs cheveux, variantes à options, réservations de stock, historique commandes, wishlist, avis, blocs, paramètres)
prisma/migrations/             migration initiale SQL (contraintes CHECK anti-stock-négatif)
prisma/seed.ts                 données MAMAHAIR
messages/{en,es,fr,ht}.json    textes de l'interface
src/i18n                       locale/devise (cookie → Accept-Language → Settings)
src/lib/settings.ts            centre de configuration (Admin → Settings)
src/lib/stock.ts               réservation atomique, libération, commit, expiration
src/lib/discount.ts            règles de promotion (pures + base), validation devise
src/lib/shipping.ts            tarifs par pays / devise / poids
src/lib/payments/              abstraction PaymentProvider (Stripe implémenté ; Mercado Pago, PayPal à brancher)
src/lib/{email,logger,sentry,rate-limit,upload}.ts
src/server                     Server Actions vitrine ; src/server/admin pour l'admin
src/app/(storefront)           accueil, shop, recherche, produit, panier, checkout, compte, quiz, auth, pages
src/app/admin                  administration
src/app/api                    webhook Stripe, crons, autocomplete
tests/unit, tests/e2e          vitest + Playwright
supabase/storage-policies.sql  buckets et policies
```

### Flux de commande
1. Checkout (4 étapes) → validation Zod, tous les prix recalculés côté serveur.
2. Transaction : commande `PENDING_PAYMENT` + `UPDATE Inventory SET reserved = reserved + q WHERE quantity - reserved >= q` (atomique, jamais de survente) + `StockReservation` avec `expiresAt`.
3. Session Stripe créée hors transaction ; en cas d'échec → réservations libérées, commande `CANCELLED`.
4. Webhook (idempotent via `WebhookEvent`) : `paid` → réservations converties en sortie de stock, commande `PAID`, email ; `expired` → stock libéré ; `charge.refunded` → synchronisation + remise en stock si total.
5. Cron toutes les 15 min : expiration des réservations dépassées.

### Multi-devise
Un panier a une devise ; les produits d'une autre devise n'y entrent pas. Une remise fixe et un minimum de commande ont obligatoirement une devise et ne s'appliquent qu'à un panier de cette devise. Un tarif de livraison a une devise ; un tarif d'une autre devise est refusé.

## 8. Ce qui est réellement implémenté vs préparé

| Fonction | État |
|---|---|
| Stripe Checkout, Stripe Tax, Apple Pay / Google Pay (via Stripe), remboursements, webhook idempotent | **Implémenté** |
| Mercado Pago (OXXO, SPEI), PayPal | **Non implémenté.** L'interface `PaymentProvider` (`src/lib/payments/types.ts`) et le registre sont prêts ; les interrupteurs Settings → Payments n'ont aucun effet tant qu'un provider n'est pas écrit et enregistré. |
| Multi-devise (USD, MXN, CAD, DOP, HTG) | **Implémenté** côté données et règles (panier mono-devise, remises et tarifs contrôlés). Il n'y a **pas de conversion automatique** : un produit a un prix par devise (`Product.currency`), et seule la devise par défaut est activée par le seed. |
| Multi-langue en / es / fr / ht | **Implémenté** pour l'interface, les pages et les blocs d'accueil. Les tables `ProductTranslation` / `CategoryTranslation` existent mais **aucun écran admin** ne les alimente encore. |
| Sentry | **Optionnel, non installé.** `@sentry/nextjs` n'est pas dans `package.json`. `instrumentation.ts` et `src/lib/sentry.ts` le chargent dynamiquement uniquement si vous l'installez (`npm i @sentry/nextjs`) et définissez `SENTRY_DSN` ; sans cela, tout est ignoré silencieusement. |
| Shippo / EasyPost | **Non implémenté.** Champ `Shipment.labelUrl` et paramètre `carrierIntegration` prévus, aucun appel API. |
| Rate limiting | **Implémenté en mémoire par instance** (auth, checkout, avis, newsletter). Suffisant pour freiner les abus ; pour une limite globale multi-instances, brancher Upstash Redis dans `src/lib/rate-limit.ts`. |
| Panier abandonné | **Implémenté** : détection, liste admin, email de relance par cron (une fois par panier, uniquement si l'email est connu). |
| Tests | 45 tests unitaires (vitest) exécutés et verts. 5 scénarios Playwright écrits, à lancer sur une base seedée (`npm run test:e2e`). |

## 9. Garanties de stock et de paiement

- Réservation : `UPDATE "Inventory" SET reserved = reserved + q WHERE quantity - reserved >= q` — deux clients ne peuvent pas prendre le dernier article.
- Libération / débit / remise en stock : UPDATE conditionnels ; si la condition échoue, une `StockInconsistencyError` est levée et journalisée (aucun `GREATEST()` qui masquerait le problème). Contraintes CHECK en base : `quantity >= 0`, `reserved >= 0`, `reserved <= quantity`.
- Toute transition de commande (webhook payé / expiré / remboursé, cron d'expiration, annulation admin) verrouille la ligne `Order` (`SELECT … FOR UPDATE`) et relit le statut sous verrou : un webhook « paid » et une expiration simultanés ne peuvent pas s'entrelacer.
- Réservations marquées `committedAt` / `releasedAt` par UPDATE conditionnel : un webhook rejoué ou un cron relancé ne débite ni ne libère deux fois.
- Idempotence webhook : l'id d'événement Stripe est inséré dans `WebhookEvent` (clé primaire) avant traitement ; en cas d'échec, il est retiré pour que Stripe rejoue.
- Le navigateur n'est jamais l'autorité : `/checkout/success` affiche le statut lu en base et se rafraîchit jusqu'à confirmation par le webhook.
- Une session Stripe encore ouverte est fermée (`sessions.expire`) quand la commande est annulée par l'admin ou expirée par le cron. Si un paiement arrive malgré tout sur une commande annulée, la commande est annotée « refund required » et une erreur est journalisée.
