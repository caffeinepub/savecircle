import { useActor } from "@/hooks/useActor";
/**
 * SaveCircle Auth Utilities
 * Wraps useInternetIdentity and exposes a clean useAuth + useIsAdmin API.
 */
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { identity, login, clear, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return {
    isAuthenticated,
    isInitializing,
    login,
    logout: clear,
    principal: identity?.getPrincipal(),
  };
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: ["isAdmin", isAuthenticated],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  return data ?? false;
}
