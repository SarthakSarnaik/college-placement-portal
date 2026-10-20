import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Me = {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
};

export const meQuery = {
  queryKey: ["me"],
  queryFn: async (): Promise<Me | null> => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return null;
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    ]);
    return {
      id: user.id,
      email: user.email ?? "",
      fullName: profile?.full_name || (user.user_metadata?.["full_name"] as string) || "",
      isAdmin: !!roles?.some((r) => r.role === "admin"),
    };
  },
  staleTime: 60_000,
};

export function useMe() {
  return useQuery(meQuery);
}
