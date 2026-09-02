"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ProductReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  photoUrls: string[];
  isVerifiedPurchase: boolean;
  createdAt: string;
  customerName: string;
};

type SortMode = "recent" | "highest" | "photos";

export function ProductReviewList({ reviews, verifiedLabel }: { reviews: ProductReviewItem[]; verifiedLabel: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [sort, setSort] = useState<SortMode>("recent");

  const counts = useMemo(() => {
    const result = [0, 0, 0, 0, 0, 0];
    for (const review of reviews) result[review.rating] += 1;
    return result;
  }, [reviews]);

  const visible = useMemo(() => {
    const filtered = rating ? reviews.filter((review) => review.rating === rating) : [...reviews];
    if (sort === "highest") return filtered.sort((a, b) => b.rating - a.rating || Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (sort === "photos") return filtered.sort((a, b) => Number(b.photoUrls.length > 0) - Number(a.photoUrls.length > 0) || Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [rating, reviews, sort]);

  return (
    <div>
      <div className="mb-5 rounded-[1.4rem] border border-sand/70 bg-[#fbf8f5] p-3 sm:p-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => setRating(null)} className={filterClass(rating === null)}>
            All <span className="opacity-60">{reviews.length}</span>
          </button>
          {[5, 4, 3, 2, 1].map((value) => (
            <button key={value} type="button" onClick={() => setRating(value)} className={filterClass(rating === value)}>
              {value}★ <span className="opacity-60">{counts[value]}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-sand/70 pt-3">
          <p className="text-xs text-ink-soft">Showing {visible.length} review{visible.length === 1 ? "" : "s"}</p>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="rounded-full border border-sand bg-white px-3 py-2 text-xs font-semibold text-cocoa outline-none focus:border-cocoa">
            <option value="recent">Most recent</option>
            <option value="highest">Highest rated</option>
            <option value="photos">With photos first</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-sand bg-white p-8 text-center">
          <p className="font-semibold text-cocoa">No reviews match this filter.</p>
          <button type="button" onClick={() => setRating(null)} className="mt-2 text-xs font-semibold text-flame underline">Show all reviews</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((review) => (
            <article id={`review-${review.id}`} key={review.id} className="scroll-mt-32 rounded-[1.5rem] border border-sand/70 bg-white p-5 shadow-[0_10px_25px_rgba(74,27,12,0.035)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm tracking-[0.1em] text-flame">{"★".repeat(review.rating)}<span className="text-sand">{"★".repeat(5 - review.rating)}</span></span>
                {review.isVerifiedPurchase && <Badge tone="green">{verifiedLabel}</Badge>}
              </div>
              {review.title && <p className="mt-4 text-base font-semibold text-cocoa">{review.title}</p>}
              {review.body && <p className="mt-2 text-sm leading-7 text-ink-soft">{review.body}</p>}
              {review.photoUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {review.photoUrls.slice(0, 6).map((url) => (
                    <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-petal ring-1 ring-sand/70">
                      <Image src={url} alt="Customer review photo" fill sizes="160px" className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-sand pt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">{review.customerName}</p>
                <time className="text-[10px] text-ink-soft" dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function filterClass(active: boolean) {
  return cn("shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition", active ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white text-cocoa hover:border-cocoa");
}
