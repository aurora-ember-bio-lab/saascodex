import { describe, expect, it } from 'vitest';

import {
  normalizeSplatStudioTelemetryRelayUrl,
  SPLATSTUDIO_TELEMETRY_RELAY_URLS,
} from '../../src/integrations/telemetry-relay.js';

describe('SplatStudio telemetry relay URLs', () => {
  it('keeps production on telemetry.splatstudio.app', () => {
    expect(SPLATSTUDIO_TELEMETRY_RELAY_URLS.prod).toBe(
      'https://telemetry.splatstudio.app/api/langfuse',
    );
    expect(normalizeSplatStudioTelemetryRelayUrl(
      'https://telemetry.splatstudio.app/api/langfuse//',
    )).toBe(SPLATSTUDIO_TELEMETRY_RELAY_URLS.prod);
  });

  it('moves legacy self-host test URLs to telemetry-test.splatstudio.app', () => {
    expect(normalizeSplatStudioTelemetryRelayUrl(
      'https://telemetry-selfhost.splatstudio.app/api/langfuse/',
    )).toBe(SPLATSTUDIO_TELEMETRY_RELAY_URLS.test);
  });

  it('leaves custom relay URLs unchanged', () => {
    expect(normalizeSplatStudioTelemetryRelayUrl(
      'https://telemetry.example.test/api/langfuse/',
    )).toBe('https://telemetry.example.test/api/langfuse');
  });
});
