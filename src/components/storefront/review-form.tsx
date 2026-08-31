"use client";
import { useActionState, useState } from "react";
import { submitReview, type ReviewState } from "@/server/reviews";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

export function ReviewForm({ productId, title, loggedIn }: { productId: string; title: string; loggedIn: boolean }) {
  const [state, action] = useActionState<ReviewState, FormData>(submitReview, {});
  const [rating, setRating] = useState(5);
  if (!loggedIn) return <p className="text-sm text-ink-soft"><a href="/login" className="text-flame underline">Sign in</a> to write a review.</p>;
  if (state.message) return <Alert tone="success">{state.message}</Alert>;
  return (
    <form action={action} className="space-y-4 rounded-2xl bg-white p-5">
      <h3 className="font-body text-base font-semibold">{title}</h3>
      {state.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className={`text-2xl ${n <= rating ? "text-flame" : "text-sand"}`}>★</button>)}</div>
      <Field label="Title (optional)"><Input name="title" maxLength={120} /></Field>
      <Field label="Your review"><Textarea name="body" required minLength={10} maxLength={2000} /></Field>
      <Field label="Photos (up to 3)"><Input type="file" name="photos" accept="image/*" multiple className="py-2" /></Field>
      <SubmitButton pendingText="Sending…">Submit review</SubmitButton>
    </form>
  );
}
