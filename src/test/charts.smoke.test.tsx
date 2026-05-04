import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { MacroChart } from "@/components/MacroChart";
import { WeeklyChart } from "@/components/WeeklyChart";
import { WaterWeeklyChart } from "@/components/WaterWeeklyChart";
import { WeeklyHabitTracker } from "@/components/WeeklyHabitTracker";

// Mock the data hook used by WaterWeeklyChart so the test stays hermetic.
vi.mock("@/hooks/useWaterIntake", () => ({
  useWeeklyWater: () => ({
    data: Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return { date: d.toISOString().split("T")[0], glasses: 4 + i };
    }),
  }),
}));

// Recharts measures container size via ResizeObserver — provide a stub so charts
// receive non-zero dimensions and don't emit the width/height warning.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

// Force ResponsiveContainer to resolve to a fixed size in jsdom.
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => 600,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 300,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 600,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => 300,
  });
});

const sampleLogs = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return {
    date: d.toISOString().split("T")[0],
    total_calories: 1800 + i * 25,
    protein: 120 + i,
    carbs: 200 + i * 2,
    fats: 60 + i,
    current_weight: 80 - i * 0.1,
    workout_type: i % 2 === 0 ? "Strength" : "Rest",
    workout_duration_mins: i % 2 === 0 ? 45 : 0,
  };
});

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <div style={{ width: 600, height: 300 }}>{ui}</div>
    </QueryClientProvider>
  );
}

interface ConsoleSpy {
  errorSpy: ReturnType<typeof vi.spyOn>;
  warnSpy: ReturnType<typeof vi.spyOn>;
}

function spyConsole(): ConsoleSpy {
  return {
    errorSpy: vi.spyOn(console, "error").mockImplementation(() => {}),
    warnSpy: vi.spyOn(console, "warn").mockImplementation(() => {}),
  };
}

function assertNoConsoleNoise({ errorSpy, warnSpy }: ConsoleSpy, name: string) {
  const errors = errorSpy.mock.calls.map((c) => String(c[0]));
  const warnings = warnSpy.mock.calls.map((c) => String(c[0]));
  expect(
    errors,
    `${name} produced console.error:\n${errors.join("\n---\n")}`
  ).toEqual([]);
  expect(
    warnings,
    `${name} produced console.warn:\n${warnings.join("\n---\n")}`
  ).toEqual([]);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Charts render without console noise", () => {
  const cases: Array<[string, () => React.ReactElement]> = [
    ["MacroChart", () => <MacroChart logs={sampleLogs} />],
    ["WeeklyChart", () => <WeeklyChart logs={sampleLogs} />],
    ["WaterWeeklyChart", () => <WaterWeeklyChart />],
    ["WeeklyHabitTracker", () => <WeeklyHabitTracker logs={sampleLogs} />],
  ];

  for (const [name, factory] of cases) {
    it(`${name} renders cleanly`, () => {
      const spies = spyConsole();
      renderWithProviders(factory());
      assertNoConsoleNoise(spies, name);
    });
  }
});
