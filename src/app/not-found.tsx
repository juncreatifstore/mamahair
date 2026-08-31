import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-32 text-center">
      <h1 className="text-5xl">Page not found</h1>
      <p className="mt-4 text-ink-soft">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <Link href="/" className="mt-8 inline-block underline">Back to home</Link>
    </div>
  );
}
