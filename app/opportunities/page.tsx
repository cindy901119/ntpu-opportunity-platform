import { Navbar } from "@/src/components/Navbar";
import { getPublishedCompetitions } from "@/src/lib/competitions";
import { OpportunitiesClient } from "./opportunities-client";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const opportunities = await getPublishedCompetitions();

  return (
    <div className="app-shell">
      <Navbar />
      <OpportunitiesClient opportunities={opportunities} />
    </div>
  );
}
