import { Navbar } from "@/src/components/Navbar";
import { AccountClient } from "./account-client";

export default function AccountPage() {
  return (
    <div className="app-shell">
      <Navbar />
      <AccountClient />
    </div>
  );
}
