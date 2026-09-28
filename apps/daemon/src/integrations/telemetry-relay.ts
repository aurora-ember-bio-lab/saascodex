export const SAASCODEX_TELEMETRY_RELAY_URLS = {
  test: 'https://telemetry-test.saascodex.com/api/langfuse',
  prod: 'https://telemetry.saascodex.com/api/langfuse',
} as const;

const LEGACY_TEST_RELAY_ORIGIN = 'https://telemetry-selfhost.saascodex.com';
const TEST_RELAY_ORIGIN = 'https://telemetry-test.saascodex.com';

/**
 * Keep legacy test configurations working while moving the test Worker to its
 * environment-owned hostname. Production and custom relay URLs are unchanged.
 */
export function normalizeSaaSCodexTelemetryRelayUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '');
  return normalized.startsWith(`${LEGACY_TEST_RELAY_ORIGIN}/`) ||
    normalized === LEGACY_TEST_RELAY_ORIGIN
    ? `${TEST_RELAY_ORIGIN}${normalized.slice(LEGACY_TEST_RELAY_ORIGIN.length)}`
    : normalized;
}
