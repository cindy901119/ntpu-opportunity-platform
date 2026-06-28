import { Navbar } from "@/src/components/Navbar";
import { AuthCallbackClient } from "./auth-callback-client";

export default function AuthCallbackPage() {
  return (
    <div className="app-shell">
      <Navbar />
      <AuthCallbackClient />
    </div>
  );
}
