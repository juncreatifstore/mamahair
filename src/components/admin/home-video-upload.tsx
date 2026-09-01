"use client";

import { useActionState } from "react";
import { uploadHeroVideo, type HeroVideoUploadState, type HeroVideoSlot } from "@/server/admin/home-video";

function VideoUploadForm({ slot, label, hint }: { slot: HeroVideoSlot; label: string; hint: string }) {
  const [state, action, pending] = useActionState<HeroVideoUploadState, FormData>(uploadHeroVideo, {});
  return (
    <form action={action} className="rounded-2xl border border-sand bg-white p-4">
      <input type="hidden" name="slot" value={slot} />
      <div className="mb-3">
        <h3 className="font-semibold text-cocoa">{label}</h3>
        <p className="mt-1 text-xs leading-5 text-ink-soft">{hint}</p>
      </div>
      <input name="file" type="file" accept="video/mp4,video/webm" required className="block w-full text-xs" />
      <button disabled={pending} className="mt-3 rounded-full bg-cocoa px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
        {pending ? "Téléversement…" : "Téléverser et remplacer"}
      </button>
      {state.message && <p className="mt-3 text-xs font-medium text-emerald-700">{state.message}</p>}
      {state.error && <p className="mt-3 text-xs font-medium text-red-700">{state.error}</p>}
      {state.url && <video src={state.url} muted playsInline controls className="mt-3 aspect-video w-full rounded-xl bg-black object-cover" />}
    </form>
  );
}

export function HomeVideoUpload() {
  return (
    <section className="rounded-3xl border border-sand bg-[#faf8f5] p-4 md:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-cocoa">Vidéos du hero</h2>
        <p className="mt-1 text-sm text-ink-soft">MP4 recommandé. Taille maximale 60 MB par vidéo. Les fichiers remplacent directement les vidéos du hero sur mobile, tablette et desktop.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <VideoUploadForm slot="videoMainUrl" label="Vidéo principale" hint="Grande vidéo centrale et hero mobile." />
        <VideoUploadForm slot="videoTopRightUrl" label="Vidéo haut droite" hint="Bloc vidéo supérieur de la colonne droite." />
        <VideoUploadForm slot="videoBottomRightUrl" label="Vidéo bas droite" hint="Bloc vidéo inférieur de la colonne droite." />
      </div>
    </section>
  );
}
