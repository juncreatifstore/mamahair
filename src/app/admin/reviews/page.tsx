import Link from "next/link";
import Image from "next/image";
import { adminListReviews, moderateReview } from "@/server/admin/settings";
import { PageHeader, Card } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  const reviews = await adminListReviews(!all);
  return (
    <>
      <PageHeader title="Reviews"><Link href="/admin/reviews" className={cn("rounded-pill border px-3 py-1 text-sm", !all ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white")}>Pending</Link><Link href="/admin/reviews?all=1" className={cn("rounded-pill border px-3 py-1 text-sm", all ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white")}>All</Link></PageHeader>
      <div className="space-y-3">
        {reviews.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm"><span className="text-flame">{"★".repeat(r.rating)}</span> <Link href={`/products/${r.product.slug}`} className="font-medium underline">{r.product.name}</Link> · {r.user.firstName ?? r.user.email}{r.isVerifiedPurchase && <Badge tone="green" className="ml-2">Verified</Badge>}{r.isApproved && <Badge tone="blue" className="ml-2">Published</Badge>}</p>
                {r.title && <p className="mt-1 font-medium">{r.title}</p>}<p className="mt-1 text-sm text-ink-soft">{r.body}</p>
                {r.photoUrls.length > 0 && <div className="mt-2 flex gap-2">{r.photoUrls.map((u) => <div key={u} className="relative size-16 overflow-hidden rounded-lg bg-petal"><Image src={u} alt="" fill sizes="64px" className="object-cover" /></div>)}</div>}
                <p className="mt-1 text-xs text-ink-soft">{formatDate(r.createdAt)}</p>
              </div>
              <div className="flex gap-2">{!r.isApproved && <form action={async () => { "use server"; await moderateReview(r.id, true); }}><button className="rounded-pill bg-emerald-700 px-4 py-2 text-sm text-white">Approve</button></form>}<form action={async () => { "use server"; await moderateReview(r.id, false); }}><button className="rounded-pill border border-red-300 px-4 py-2 text-sm text-red-700">Delete</button></form></div>
            </div>
          </Card>
        ))}
        {reviews.length === 0 && <p className="text-sm text-ink-soft">Nothing to moderate.</p>}
      </div>
    </>
  );
}
