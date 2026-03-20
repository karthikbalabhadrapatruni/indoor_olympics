"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/client/api";
import { INITIAL_BOOTSTRAP_STATE, PALETTES } from "../lib/client/constants";

export function useGameTrackerData() {
  const [data, setData] = useState(INITIAL_BOOTSTRAP_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const paletteMap = useMemo(() => {
    return data.users.reduce((accumulator, user, index) => {
      accumulator[user.user_id] = PALETTES[index % PALETTES.length];
      return accumulator;
    }, {});
  }, [data.users]);

  async function refresh() {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest("/api/bootstrap");
      setData(result);
      return result;
    } catch (loadError) {
      setError(loadError.message);
      throw loadError;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  return {
    data,
    loading,
    error,
    paletteMap,
    refresh,
  };
}
