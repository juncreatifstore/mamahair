import { requireOwner } from "@/lib/auth";
export default async function SettingsLayout({ children }: { children: React.ReactNode }) { await requireOwner(); return children; }
