"use client";

import { createContext, useContext } from "react";

type DashboardShellContextValue = {
  openMenu: () => void;
  closeMenu: () => void;
  menuOpen: boolean;
};

export const DashboardShellContext =
  createContext<DashboardShellContextValue | null>(null);

export function useDashboardShell() {
  return useContext(DashboardShellContext);
}
