import "server-only";

const dictionaries = {
  it: () => import("../../../dictionaries/it.json").then((m) => m.default),
  en: () => import("../../../dictionaries/en.json").then((m) => m.default),
};

export type Locale = keyof typeof dictionaries;
export const locales: Locale[] = ["it", "en"];
export const defaultLocale: Locale = "it";

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries;

export const getDictionary = (locale: Locale) => dictionaries[locale]();
