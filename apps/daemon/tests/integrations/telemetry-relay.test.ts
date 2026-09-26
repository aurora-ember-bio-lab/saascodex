import { describe, expect, it } from 'vitest';

import {
  normalizeSaaSCodexTelemetryRelayUrl,
  SAASCODEX_TELEMETRY_RELAY_URLS,
} from '../../src/integrations/telemetry-relay.js';

describe('SaaSCodex telemetry relay URLs', () => {
  it('keeps production on telemetry.open-design.ai', () => {
    expect(SAASCODEX_TELEMETRY_RELAY_URLS.prod).toBe(
      'https://telemetry.open-design.ai/api/langfuse',
    );
    expect(normalizeSaaSCodexTelemetryRelayUrl(
      'https://telemetry.open-design.ai/api/langfuse//',
    )).toBe(SAASCODEX_TELEMETRY_RELAY_URLS.prod);
  });

  it('moves legacy self-host test URLs to telemetry-test.open-design.ai', () => {
    expect(normalizeSaaSCodexTelemetryRelayUrl(
      'https://telemetry-selfhost.open-design.ai/api/langfuse/',
    )).toBe(SAASCODEX_TELEMETRY_RELAY_URLS.test);
  });

  it('leaves custom relay URLs unchanged', () => {
    expect(normalizeSaaSCodexTelemetryRelayUrl(
      'https://telemetry.example.test/api/langfuse/',
    )).toBe('https://telemetry.example.test/api/langfuse');
  });
});
