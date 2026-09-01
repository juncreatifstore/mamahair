import Link from "next/link";
import { HeroVideo } from "./hero-video";

export type TextureVideoItem = {
  name: string;
  href: string;
  videoUrl: string;
  posterUrl: string;
  objectPosition?: string;
};

export function TextureVideoCard({ item }: { item: TextureVideoItem }) {
  return (
    <Link
      href={item.href}
      className="group relative block h-[270px] min-w-[180px] shrink-0 overflow-hidden rounded-[1.35rem] bg-cocoa sm:h-[340px] sm:min-w-[230px] lg:h-[390px] lg:min-w-0"
    >
      <HeroVideo
        src={item.videoUrl}
        poster={item.posterUrl}
        objectPosition={item.objectPosition ?? "center"}
        className="transition duration-700 group-hover:scale-[1.035]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white sm:text-sm">{item.name}</p>
      </div>
    </Link>
  );
}
