import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { BrandMark } from "@/components/site/BrandMark";
import { Loader2 } from "lucide-react";

function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <BrandMark size={56} />
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <div className="text-sm text-muted-foreground">Loading...</div>
    </div>
  );
}

/**
 * UX-only guard. The real security boundary is server-side: RLS plus the
 * role/ownership checks in src/lib/api/guards.server.ts. Fails closed.
 */
export function RequireAuth({
  children,
  role: requiredRole,
}: {
  children: ReactNode;
  role?: "student" | "teacher" | "admin";
}) {
  const { user, role, loading, roleLoading } = useAuth();
  const navigate = useNavigate();

  const checking = loading || (!!user && roleLoading);

  useEffect(() => {
    if (checking) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (requiredRole && role !== requiredRole) {
      navigate({ to: "/login", replace: true });
    }
  }, [checking, user, role, requiredRole, navigate]);

  if (checking || !user || (requiredRole && role !== requiredRole)) return <LoadingState />;

  return <>{children}</>;
}
