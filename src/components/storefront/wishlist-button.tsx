"use client";
import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleWishlist, mergeGuestWishlist } from "@/server/wishlist";
import { cn } from "@/lib/utils";

const KEY = "mamahair:wishlist";
const readGuest = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };
const writeGuest = (ids: string[]) => localStorage.setItem(KEY, JSON.stringify(ids));

/** Bouton favoris : base pour les connectés, localStorage pour les invités, fusion après connexion (WishlistSync). */
export function WishlistButton({ productId, variantId, saved: initial, labels, compact }: { productId: string; variantId?: string | null; saved?: boolean; labels: { save: string; saved: string }; compact?: boolean }) {
  const [saved, setSaved] = useState(!!initial);
  const [pending, start] = useTransition();
  useEffect(() => { if (!initial && readGuest().includes(productId)) setSaved(true); }, [initial, productId]);

  const toggle = () =>
    start(async () => {
      const res = await toggleWishlist(productId, variantId);
      if ("requiresAuth" in res) {
        const ids = readGuest();
        const next = ids.includes(productId) ? ids.filter((i) => i !== productId) : [...ids, productId];
        writeGuest(next); setSaved(next.includes(productId));
      } else setSaved(res.saved);
    });

  if (compact) return <button aria-label={saved ? labels.saved : labels.save} aria-pressed={saved} onClick={toggle} disabled={pending} className="grid size-9 place-items-center rounded-pill bg-cream/95 shadow-sm hover:bg-white"><Heart className={cn("size-4", saved && "fill-flame text-flame")} /></button>;
  return (
    <button onClick={toggle} disabled={pending} aria-pressed={saved} className={cn("inline-flex h-11 items-center gap-2 rounded-pill border px-4 text-sm font-medium", saved ? "border-flame text-flame" : "border-sand hover:bg-petal")}>
      <Heart className={cn("size-4", saved && "fill-flame")} /> {saved ? labels.saved : labels.save}
    </button>
  );
}

/** À monter dans le layout : fusionne la wishlist invitée dès qu'un utilisateur est connecté. */
export function WishlistSync({ loggedIn }: { loggedIn: boolean }) {
  useEffect(() => {
    if (!loggedIn) return;
    const ids = readGuest();
    if (ids.length) mergeGuestWishlist(ids).then(() => writeGuest([]));
  }, [loggedIn]);
  return null;
}
