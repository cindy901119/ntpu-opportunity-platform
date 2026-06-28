import { Navbar } from "@/src/components/Navbar";
import { PreferencesClient } from "./preferences-client";

export default function PreferencesPage() {
  return (
    <div className="app-shell">
      <Navbar />
      <PreferencesClient />
    </div>
  );
}
