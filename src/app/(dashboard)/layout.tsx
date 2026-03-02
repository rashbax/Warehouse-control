import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userName = session.user.name ?? "User";
  const userInitial = userName[0].toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-0">
        <header className="bg-white border-b border-slate-200 pl-16 pr-6 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 text-sm font-semibold">
                {userInitial}
              </span>
            </div>
            <span className="text-sm text-slate-700 font-medium">
              {userName}
            </span>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6 overflow-y-auto min-h-0">{children}</div>
      </main>
    </div>
  );
}
