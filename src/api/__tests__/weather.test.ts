import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to mock import.meta.env before importing the module.
// Vitest lets us control import.meta.env directly.

describe("fetchWeather", () => {
  const FAKE_KEY = "TEST_API_KEY_123";
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    vi.stubGlobal("fetch", mockFetch);
    vi.stubEnv("VITE_WEATHER_API_KEY", FAKE_KEY);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadFetchWeather() {
    const mod = await import("../weather");
    return mod.fetchWeather;
  }

  it("builds the correct URL with encoded location and date range", async () => {
    const fakeResponse = { resolvedAddress: "NYC", address: "NYC", timezone: "America/New_York", days: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(fakeResponse),
    });

    const fetchWeather = await loadFetchWeather();
    await fetchWeather("New York, NY");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(encodeURIComponent("New York, NY"));
    expect(url).toContain("unitGroup=us");
    expect(url).toContain(`key=${FAKE_KEY}`);
    expect(url).toContain("include=days%2Chours");
    // URL should contain date range (YYYY-MM-DD/YYYY-MM-DD) instead of next15days
    expect(url).toMatch(/\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}/);
    expect(url).not.toContain("next15days");
    expect(options).toHaveProperty("signal");
  });

  it("shifts the date range by weekOffset", async () => {
    const fakeResponse = { resolvedAddress: "NYC", address: "NYC", timezone: "America/New_York", days: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(fakeResponse),
    });

    const fetchWeather = await loadFetchWeather();
    await fetchWeather("NYC", undefined, 2);

    const [url] = mockFetch.mock.calls[0];
    // Extract the start date from the URL
    const dateMatch = url.match(/(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})/);
    expect(dateMatch).not.toBeNull();

    const startDate = new Date(dateMatch![1] + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expectedStart = new Date(today);
    expectedStart.setDate(expectedStart.getDate() + 14); // 2 weeks

    // Allow 1 day tolerance for date boundary edge cases
    const diffDays = Math.abs(
      (startDate.getTime() - expectedStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBeLessThanOrEqual(1);
  });

  it("passes the abort signal to fetch", async () => {
    const fakeResponse = { resolvedAddress: "NYC", address: "NYC", timezone: "America/New_York", days: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(fakeResponse),
    });

    const controller = new AbortController();
    const fetchWeather = await loadFetchWeather();
    await fetchWeather("NYC", controller.signal);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.signal).toBe(controller.signal);
  });

  it("returns parsed JSON on success", async () => {
    const fakeResponse = { resolvedAddress: "NYC", address: "NYC", timezone: "America/New_York", days: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(fakeResponse),
    });

    const fetchWeather = await loadFetchWeather();
    const result = await fetchWeather("New York");

    expect(result).toEqual(fakeResponse);
  });

  it('throws "Location not found" on HTTP 400', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    const fetchWeather = await loadFetchWeather();
    await expect(fetchWeather("InvalidPlace")).rejects.toThrow(
      "Location not found"
    );
  });

  it("throws generic error on other HTTP failures", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const fetchWeather = await loadFetchWeather();
    await expect(fetchWeather("NYC")).rejects.toThrow("Weather API error: 500");
  });

  it("throws on missing API key", async () => {
    vi.stubEnv("VITE_WEATHER_API_KEY", "");
    vi.resetModules();

    const fetchWeather = await loadFetchWeather();
    await expect(fetchWeather("NYC")).rejects.toThrow(
      "Missing VITE_WEATHER_API_KEY"
    );
  });
});
