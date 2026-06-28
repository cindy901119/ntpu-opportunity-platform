import { Navbar } from "@/src/components/Navbar";
import { getPublishedCompetitions } from "@/src/lib/competitions";
import { SavedClient } from "./saved-client";

export default async function SavedPage() {
  const opportunities = await getPublishedCompetitions();

  return (
    <div className="app-shell">
      <Navbar />
      <SavedClient opportunities={opportunities} />
    </div>
  );
}
