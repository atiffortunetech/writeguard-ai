/** Supported translation languages — any pair works via OpenAI. */
export interface TranslationLanguage {
  code: string;
  name: string;
  nativeName: string;
  popular?: boolean;
}

export const AUTO_DETECT_LANGUAGE: TranslationLanguage = {
  code: "auto",
  name: "Auto-detect",
  nativeName: "Auto-detect",
};

export const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  { code: "en", name: "English", nativeName: "English", popular: true },
  { code: "ur", name: "Urdu", nativeName: "اردو", popular: true },
  { code: "ar", name: "Arabic", nativeName: "العربية", popular: true },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", popular: true },
  { code: "es", name: "Spanish", nativeName: "Español", popular: true },
  { code: "fr", name: "French", nativeName: "Français", popular: true },
  { code: "de", name: "German", nativeName: "Deutsch", popular: true },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文", popular: true },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語", popular: true },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "pt", name: "Portuguese", nativeName: "Português", popular: true },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "fa", name: "Persian", nativeName: "فارسی" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
  { code: "fil", name: "Filipino", nativeName: "Filipino" },
];

export function getLanguageByCode(code: string): TranslationLanguage | undefined {
  if (code === "auto") return AUTO_DETECT_LANGUAGE;
  return TRANSLATION_LANGUAGES.find((l) => l.code === code);
}

export function languageLabel(lang: TranslationLanguage): string {
  return lang.nativeName !== lang.name
    ? `${lang.name} (${lang.nativeName})`
    : lang.name;
}

export const POPULAR_LANGUAGE_CODES = TRANSLATION_LANGUAGES.filter((l) => l.popular).map(
  (l) => l.code
);

export const SOURCE_LANGUAGE_CODES = ["auto", ...TRANSLATION_LANGUAGES.map((l) => l.code)] as const;

export const TARGET_LANGUAGE_CODES = TRANSLATION_LANGUAGES.map((l) => l.code);
