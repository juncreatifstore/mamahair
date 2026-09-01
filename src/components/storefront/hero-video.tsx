type HeroVideoProps = {
  src: string;
  poster: string;
  className?: string;
  objectPosition?: string;
};

export function HeroVideo({ src, poster, className = "", objectPosition = "center" }: HeroVideoProps) {
  return (
    <video
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
      style={{ objectPosition }}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
