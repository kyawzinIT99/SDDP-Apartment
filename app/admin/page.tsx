import { getChatGPTUser } from "../chatgpt-auth";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getChatGPTUser();
  if (!user) return <AdminLogin />;
  return <AdminDashboard displayName={user.displayName} role={user.role} />;
}
