"use client";

import { useCallback, useState } from "react";
import type { FormattedTextValue } from "@/components/tools/formatted-text-input";
import { buildToolRequestPayload, hasRichFormatting } from "@/lib/formatted-text";

export function useFormattedContent() {
  const [html, setHtml] = useState("");
  const [plainText, setPlainText] = useState("");

  const onFormattedChange = useCallback((value: FormattedTextValue) => {
    setHtml(value.html);
    setPlainText(value.plainText);
  }, []);

  const requestBody = useCallback(
    (extra?: Record<string, unknown>) => buildToolRequestPayload(plainText, html, extra),
    [plainText, html]
  );

  return {
    html,
    plainText,
    onFormattedChange,
    requestBody,
    isEmpty: !plainText.trim(),
    hasFormatting: hasRichFormatting(html),
  };
}
