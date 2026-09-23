import { Feed } from "@/components/Feed";
import { Landing } from "@/components/Landing";
import { readSession } from "@/lib/auth";

export default async function Home() {
  const session = await readSession();

  if (!session) return <Landing />;

  return (
    <div>
      <header className="glass sticky top-11 z-20 border-b hairline px-4 py-3">
        <h1 className="text-[17px] font-bold tracking-tight">Home</h1>
      </header>
      <div className="px-4 py-3">
        <Feed />
      </div>
    </div>
  );
}
