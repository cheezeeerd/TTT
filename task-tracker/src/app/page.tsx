import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions as any);
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {!(session as any)?.user ? (
        <div className="rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur">
          <h1 className="text-xl font-semibold mb-4">Welcome to YYZ Tasks</h1>
          <p className="opacity-80 mb-4">Sign in to start tracking tasks.</p>
          <Link href="/signin" className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2">Sign in</Link>
        </div>
      ) : (
        <div>
          <Link href="/board" className="underline">Go to your board →</Link>
        </div>
      )}
    </main>
  );
}
