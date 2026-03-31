import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import type { WeatherResponse } from "../types/weather";
import { fetchWeather } from "../api/weather";

const TIMEOUT_MS = 10_000;

interface FetchState {
  data: WeatherResponse | null;
  loading: boolean;
  error: string | null;
}

const ACTIONS = {
  FETCH_START: "FETCH_START",
  FETCH_SUCCESS: "FETCH_SUCCESS",
  FETCH_ERROR: "FETCH_ERROR",
} as const;

type FetchAction =
  | { type: typeof ACTIONS.FETCH_START }
  | { type: typeof ACTIONS.FETCH_SUCCESS; data: WeatherResponse }
  | { type: typeof ACTIONS.FETCH_ERROR; error: string };

function fetchReducer(_state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case ACTIONS.FETCH_START: {
      return { data: null, loading: true, error: null };
    }
    case ACTIONS.FETCH_SUCCESS: {
      return { data: action.data, loading: false, error: null };
    }
    case ACTIONS.FETCH_ERROR: {
      return { data: null, loading: false, error: action.error };
    }
    default: {
      return _state;
    }
  }
}

const INITIAL_STATE: FetchState = { data: null, loading: false, error: null };

export function useWeather(initialLocation = "", weekOffset: number = 0) {
  const [location, setLocation] = useState(initialLocation);
  const [state, dispatch] = useReducer(fetchReducer, INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async (loc: string, offset: number) => {
    if (!loc.trim()) {
      return;
    }

    // Abort any in-flight request
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    // Auto-abort after timeout
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, TIMEOUT_MS);

    dispatch({ type: ACTIONS.FETCH_START });

    try {
      const result = await fetchWeather(loc, controller.signal, offset);
      clearTimeout(timer);

      dispatch({ type: ACTIONS.FETCH_SUCCESS, data: result });
    } catch (err) {
      clearTimeout(timer);

      if (controller.signal.aborted) {
        if (timedOut) {
          dispatch({
            type: ACTIONS.FETCH_ERROR,
            error:
              "Request timed out. The weather service may be slow — try again.",
          });
        }

        return;
      }

      dispatch({
        type: ACTIONS.FETCH_ERROR,
        error: err instanceof Error ? err.message : "Failed to fetch weather",
      });
    }
  }, []);

  useEffect(() => {
    if (location) {
      doFetch(location, weekOffset);
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [location, weekOffset, doFetch]);

  return { ...state, location, setLocation };
}
