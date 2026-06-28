import { Navbar } from "@/src/components/Navbar";
import { DataStagingClient } from "./data-staging-client";

export default function DataStagingPage() {
  return (
    <div className="app-shell">
      <Navbar />
      <DataStagingClient />
    </div>
  );
}

