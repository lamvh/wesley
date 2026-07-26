"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Fired on the window after a write so every hook instance in this tab
 *  re-reads. The native `storage` event only reaches *other* tabs. */
const CHANGE_EVENT = "wesley:pref-change";

/**
 * A boolean UI preference kept in localStorage, so it survives both a reload and
 * a remount (several portal views are keyed on something that changes, e.g. the
 * roster remounts on every week change).
 *
 * useSyncExternalStore rather than useState + useEffect: the value only exists
 * on the client, and this is the hook built for reading an external store
 * without desyncing hydration - it serves the server snapshot for the first
 * paint, then re-renders with the stored one. Seeding useState from
 * localStorage would mismatch hydration; writing it back in an effect trips
 * react-hooks/set-state-in-effect.
 */
export function usePersistedToggle(
  key: string,
  fallback = false,
): readonly [boolean, () => void] {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(CHANGE_EVENT, onStoreChange);
    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener(CHANGE_EVENT, onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : raw === "1";
    } catch {
      // Private browsing / storage disabled - fall back rather than crash the view.
      return fallback;
    }
  }, [key, fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(key, value ? "0" : "1");
    } catch {
      // Ignore - the toggle just won't persist.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [key, value]);

  return [value, toggle] as const;
}
