// WeatherAPI condition codes: https://www.weatherapi.com/docs/weather_conditions.json
const GROUPS: [number[], string, string][] = [
  [[1000], "Ясно", "☀"],
  [[1003], "Мінлива хмарність", "⛅"],
  [[1006, 1009], "Хмарно", "☁"],
  [
    [
      1012, 1015, 1018, 1021, 1024, 1027, 1030, 1033, 1036, 1039, 1042, 1045,
      1048,
    ],
    "Імла",
    "🌫",
  ],
  [[1135], "Туман", "🌫"],
  [[1147], "Крижаний туман", "🌫"],
  [[1063, 1150, 1153, 1180, 1240], "Місцями дощ", "🌦"],
  [
    [1072, 1168, 1171, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1243, 1246],
    "Дощ",
    "🌧",
  ],
  [
    [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1261, 1264],
    "Сніг",
    "❄",
  ],
  [[1069, 1204, 1207, 1249, 1252], "Мокрий сніг", "🌨"],
  [[1255, 1258], "Снігові заряди", "🌨"],
  [[1087, 1273, 1276, 1279, 1282], "Гроза", "⛈"],
];
const CONDITIONS = Object.fromEntries(
  GROUPS.flatMap(([codes, label, icon]) =>
    codes.map((code) => [code, { label, icon }]),
  ),
);
export function weatherCondition(code: number, isDay = true, text?: string) {
  const condition = CONDITIONS[code] ?? {
    label: "Немає даних про стан неба",
    icon: "—",
  };
  return {
    label: text || condition.label,
    icon:
      !isDay && code === 1000
        ? "☾"
        : !isDay && code === 1003
          ? "☁☾"
          : condition.icon,
  };
}
