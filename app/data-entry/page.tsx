import { Navbar } from "@/src/components/Navbar";
import { DataEntryClient } from "./data-entry-client";

export default function DataEntryPage() {
  return (
    <div className="app-shell">
      <Navbar />
      <DataEntryClient />
    </div>
  );
}
