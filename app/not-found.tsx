import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#071926] text-[#f4ead5] flex flex-col items-center justify-center p-4">
      <h2 className="font-serif text-2xl text-[#e8bd61] mb-2">404 - Not Found</h2>
      <p className="text-sm text-[#a8bbc0] mb-4">The Grand Line route you requested does not exist.</p>
      <Link href="/" className="bg-[#e8bd61] text-[#071926] px-4 py-2 rounded text-xs font-mono font-bold">
        Return to Landing
      </Link>
    </div>
  );
}
