import { getQuizRecommendations } from "@/server/quiz";
import { getWishlistProductIds } from "@/server/wishlist";
import { getT, getCurrency } from "@/i18n/server";
import { QuizWidget } from "@/components/storefront/quiz-widget";
import { ProductCard } from "@/components/storefront/product-card";

export async function generateMetadata() { return { title: (await getT()).quiz.title }; }

export default async function QuizPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [sp, t, currency] = await Promise.all([searchParams, getT(), getCurrency()]);
  const done = sp.done === "1";
  const results = done ? await getQuizRecommendations(sp, currency) : [];
  const saved = done ? await getWishlistProductIds() : [];
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl text-cocoa sm:text-5xl">{t.quiz.title}</h1>
      <p className="mt-3 max-w-lg text-ink-soft">{t.quiz.intro}</p>
      {!done ? <div className="mt-8"><QuizWidget t={t.quiz} /></div> : (
        <div className="mt-8">
          <div className="flex items-center justify-between"><h2 className="text-2xl text-cocoa">{t.quiz.results}</h2><a href="/quiz" className="text-sm text-flame underline">{t.quiz.restart}</a></div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">{results.map((p) => <ProductCard key={p.id} p={p} saved={saved.includes(p.id)} labels={{ save: t.product.saveWishlist, saved: t.product.savedWishlist }} />)}</div>
        </div>
      )}
    </div>
  );
}
