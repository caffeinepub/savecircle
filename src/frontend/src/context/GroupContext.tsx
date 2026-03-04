import type { Group } from "@/backend.d";
import { useActor } from "@/hooks/useActor";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ACTIVE_GROUP_KEY = "savecircle_active_group_id";

interface GroupContextValue {
  activeGroup: Group | null;
  myGroups: Group[];
  isLoading: boolean;
  setActiveGroup: (group: Group) => void;
  refreshGroups: () => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_GROUP_KEY),
  );

  const { data: myGroups = [], isLoading } = useQuery<Group[]>({
    queryKey: ["myGroups"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyGroups();
    },
    enabled: !!actor && !isFetching,
  });

  // When groups load, if no activeGroupId is set, default to first group
  useEffect(() => {
    if (myGroups.length > 0 && !activeGroupId) {
      const firstId = myGroups[0].id;
      setActiveGroupId(firstId);
      localStorage.setItem(ACTIVE_GROUP_KEY, firstId);
    }
    // If stored activeGroupId is no longer in myGroups, clear it
    if (
      activeGroupId &&
      myGroups.length > 0 &&
      !myGroups.find((g) => g.id === activeGroupId)
    ) {
      const firstId = myGroups[0].id;
      setActiveGroupId(firstId);
      localStorage.setItem(ACTIVE_GROUP_KEY, firstId);
    }
  }, [myGroups, activeGroupId]);

  const activeGroup = myGroups.find((g) => g.id === activeGroupId) ?? null;

  const setActiveGroup = useCallback((group: Group) => {
    setActiveGroupId(group.id);
    localStorage.setItem(ACTIVE_GROUP_KEY, group.id);
  }, []);

  const refreshGroups = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["myGroups"] });
  }, [qc]);

  return (
    <GroupContext.Provider
      value={{
        activeGroup,
        myGroups,
        isLoading,
        setActiveGroup,
        refreshGroups,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup must be used inside GroupProvider");
  return ctx;
}
