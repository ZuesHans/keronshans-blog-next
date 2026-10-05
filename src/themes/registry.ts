import { graphiteTheme } from "./graphite";
import { nightowlTheme } from "./nightowl";

export const THEMES = { graphite: graphiteTheme, nightowl: nightowlTheme } as const;
export type ThemeId = keyof typeof THEMES;
export const DEFAULT_THEME: ThemeId = "graphite";

export function getTheme(themeId: ThemeId = DEFAULT_THEME) {
  return THEMES[themeId];
}
