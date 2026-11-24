"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Area, AllocationRun, PrioritySnapshot, ResourceStock, UserRole } from "@/domain/types";

interface AreaWithPriority extends Area {
  priority: PrioritySnapshot;
}

interface AppContextType {
  areas: AreaWithPriority[];
  inventory: ResourceStock[];
  currentRun: AllocationRun | null;
  selectedAreaId: string | null;
  setSelectedAreaId: (id: string | null) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentCity: string;
  setCurrentCity: (city: string) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  resetDemo: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [areas, setAreas] = useState<AreaWithPriority[]>([]);
  const [inventory, setInventory] = useState<ResourceStock[]>([]);
  const [currentRun, setCurrentRun] = useState<AllocationRun | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("coordinator");
  const [currentCity, setCurrentCity] = useState<string>("Chennai");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [areasRes, invRes, allocRes] = await Promise.all([
        fetch("/api/areas"),
        fetch("/api/inventory"),
        fetch("/api/allocations"),
      ]);

      if (areasRes.ok) {
        const data = await areasRes.json();
        setAreas(data.areas || []);
      }
      if (invRes.ok) {
        const data = await invRes.json();
        setInventory(data.inventory || []);
      }
      if (allocRes.ok) {
        const data = await allocRes.json();
        const runs: AllocationRun[] = data.runs || [];
        if (runs.length > 0) {
          setCurrentRun(runs[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load EQUIFLOW state:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetDemo = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetch("/api/demo/reset", { method: "POST" });
      await refreshData();
      setSelectedAreaId(null);
    } catch (err) {
      console.error("Failed to reset demo:", err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <AppContext.Provider
      value={{
        areas,
        inventory,
        currentRun,
        selectedAreaId,
        setSelectedAreaId,
        currentRole,
        setCurrentRole,
        currentCity,
        setCurrentCity,
        isLoading,
        refreshData,
        resetDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
