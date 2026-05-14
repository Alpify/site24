"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

export function LocaleHtmlLang() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.style.colorScheme = "light dark";
  }, [locale]);

  return null;
}
