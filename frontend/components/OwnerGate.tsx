"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

/**
 * OwnerGate — blocks non-OWNER users from seeing children.
 * Renders children only if the current session user has role === 'OWNER'.
 * Redirects unauthorized users to /dashboard.
 */
export default function OwnerGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
      </div>
    );
  }

  const role = (session?.user as Record<string, unknown> | undefined)?.role;
  if (role !== "OWNER") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
