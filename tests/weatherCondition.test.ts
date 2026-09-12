import { expect, it } from "vitest";
import { weatherCondition } from "@/lib/weatherCondition";
it.each([
  [1000, "Ясно", "☀"],

  [1003, "Мінлива хмарність", "⛅"],
  [1009, "Хмарно", "☁"],
  [1135, "Туман", "🌫"],
  [1147, "Крижаний туман", "🌫"],
  [1183, "Дощ", "🌧"],
  [1213, "Сніг", "❄"],
  [1255, "Снігові заряди", "🌨"],
  [1276, "Гроза", "⛈"],
])(
  "maps WeatherAPI code %i to the correct label and icon",
  (code, label, icon) => {
    expect(weatherCondition(code as number)).toEqual({ label, icon });
  },
);
it("does not invent rain for unknown codes", () => {
  expect(weatherCondition(999).icon).toBe("—");
});
it("does not show the sun at night", () => {
  expect(weatherCondition(1000, false)).toEqual({ label: "Ясно", icon: "☾" });
});
