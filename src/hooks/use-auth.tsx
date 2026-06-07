import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

type Role = "admin" | "student" | null;

type AuthCtx = {
  user: User | null;
  session: Session | null;
  role: Role;
  loading: boolean;
  roleLoading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null, session: null, role: null, loading: true,
  roleLoading: true,
  signOut: async () => {},
});

async function fetchUserRole(userId: string): Promise<Role> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to fetch user role", error);
    return null;
  }

  const roles = (data ?? []).map((row) => row.role);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("student")) return "student";
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    let active = true;

    const syncAuthState = async (sess: Session | null) => {
      if (!active) return;

      setSession(sess);
      setUser(sess?.user ?? null);

      if (!sess?.user) {
        setRole(null);
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);
      const nextRole = await fetchUserRole(sess.user.id);

      if (!active) return;

      setRole(nextRole);
      setRoleLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      void syncAuthState(sess);

      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") {
          qc.invalidateQueries();
        }
      }
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      await syncAuthState(data.session);
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Ctx.Provider value={{ user, session, role, loading, roleLoading, signOut: async () => { await supabase.auth.signOut(); } }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}