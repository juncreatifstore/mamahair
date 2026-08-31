import Link from "next/link";
import { getMyReviews } from "@/server/reviews";
import { getT } from "@/i18n/server";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function MyReviewsPage() {
  const [reviews, t] = await Promise.all([getMyReviews(), getT()]);
  return (
    <div>
      <h2 className="text-2xl text-cocoa">{t.account.reviews}</h2>
      {reviews.length === 0 ? <p className="mt-4 text-ink-soft">No reviews yet.</p> : (
        <ul className="mt-6 divide-y divide-sand rounded-3xl bg-white">{reviews.map((r) => <li key={r.id} className="px-5 py-4"><div className="flex items-center justify-between"><Link href={`/products/${r.product.slug}`} className="font-medium hover:text-flame">{r.product.name}</Link><Badge tone={r.isApproved ? "green" : "neutral"}>{r.isApproved ? "Published" : "Pending"}</Badge></div><p className="text-sm text-flame">{"★".repeat(r.rating)}</p><p className="mt-1 text-sm text-ink-soft">{r.body}</p><p className="mt-1 text-xs text-ink-soft">{formatDate(r.createdAt)}</p></li>)}</ul>
      )}
    </div>
  );
}
