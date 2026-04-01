"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const PUBLIC_ROUTES = ["/login", "/register", "/api/auth"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main id="main-content">
        <div className="mx-auto max-w-[1600px]">{children}</div>
      </main>

      <style>{`
        #main-content {
          min-height: 100vh;
          padding: 20px 16px 32px 16px;
          padding-top: 72px;
        }
        @media (min-width: 768px) {
          #main-content {
            padding: 24px 24px 40px 24px;
            padding-top: 72px;
          }
        }
        @media (min-width: 1024px) {
          #main-content {
            margin-left: 260px;
            padding: 32px 40px 48px 40px;
          }
        }
        @media (min-width: 1440px) {
          #main-content {
            padding: 40px 56px 56px 56px;
          }
        }
      `}</style>
    </>
  );
}
