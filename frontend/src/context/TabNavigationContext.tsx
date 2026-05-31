/**
 * TabNavigationContext - Contexto para navegación entre tabs con PagerView
 */
import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import type PagerView from "react-native-pager-view";

// Mapeo de rutas a índices de tabs
const TAB_ROUTES: Record<string, number> = {
  "/inicio": 0,
  "/(tabs)/inicio": 0,
  "inicio": 0,
  "/estudio": 1,
  "/(tabs)/estudio": 1,
  "estudio": 1,
  "/temas": 2,
  "/(tabs)/temas": 2,
  "temas": 2,
  "/casino": 3,
  "/(tabs)/casino": 3,
  "casino": 3,
  "/premios": 4,
  "/(tabs)/premios": 4,
  "premios": 4,
  "/ajustes": 5,
  "/(tabs)/ajustes": 5,
  "ajustes": 5,
};

type TabNavigationContextType = {
  currentPage: number;
  goToPage: (index: number) => void;
  navigateToTab: (route: string) => void;
  setPagerRef: (ref: PagerView | null) => void;
};

const TabNavigationContext = createContext<TabNavigationContextType | null>(null);

export function TabNavigationProvider({ children }: { children: React.ReactNode }) {
  const pagerRef = useRef<PagerView | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const setPagerRef = useCallback((ref: PagerView | null) => {
    pagerRef.current = ref;
  }, []);

  const goToPage = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setCurrentPage(index);
  }, []);

  const navigateToTab = useCallback((route: string) => {
    const index = TAB_ROUTES[route];
    if (index !== undefined) {
      goToPage(index);
    }
  }, [goToPage]);

  return (
    <TabNavigationContext.Provider value={{ currentPage, goToPage, navigateToTab, setPagerRef }}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error("useTabNavigation must be used within TabNavigationProvider");
  }
  return context;
}

// Hook compatible con useRouter para facilitar la migración
export function useTabRouter() {
  const { navigateToTab } = useTabNavigation();
  
  return {
    push: (path: string) => navigateToTab(path),
    navigate: (path: string) => navigateToTab(path),
    replace: (path: string) => navigateToTab(path),
  };
}
