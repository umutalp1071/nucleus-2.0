// Central redaction so a secret can never leak into a log line, an event
// payload, or an incident record from more than one place.

export function redactKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

// Strips any string that looks like an OpenRouter key out of arbitrary
// values before they're logged or stored somewhere non-secret (an event
// payload, an incident record). Defensive: catches a key even if it ends up
// somewhere it shouldn't via a bug elsewhere, not just the expected path.
const KEY_PATTERN = /sk-or-[a-zA-Z0-9-]+/g;

export function redactSecrets(value: string): string {
  return value.replace(KEY_PATTERN, "[redacted]");
}
