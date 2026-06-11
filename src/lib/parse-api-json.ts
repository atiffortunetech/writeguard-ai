/** Safely parse a fetch Response body as JSON (handles empty error bodies). */
export async function parseApiJson<T = Record<string, unknown>>(
  res: Response
): Promise<{ data: T | null; parseError: string | null }> {
  const text = await res.text();
  if (!text.trim()) {
    return {
      data: null,
      parseError: res.ok
        ? "Empty response from server"
        : `Request failed (${res.status})`,
    };
  }
  try {
    return { data: JSON.parse(text) as T, parseError: null };
  } catch {
    return { data: null, parseError: "Invalid server response" };
  }
}
