import { describe, it, expect } from 'vitest';
import type { TranslateResponse } from '../shared/types';
import { toTranslatorError, errorMessageKey } from '../src/lib/errors';
import { ApiClientError } from '../src/api/client';

describe('Translation Response & Error Handling', () => {
  it('handles classic translation response structure', () => {
    const rawResponse: TranslateResponse = {
      translatedText: 'Guten Tag',
      detectedLang: 'de',
      provider: 'deepl',
      alternatives: [],
      cached: false,
    };

    expect(rawResponse.translatedText).toBe('Guten Tag');
    expect(rawResponse.provider).toBe('deepl');
    expect(rawResponse.detectedLang).toBe('de');
  });

  it('handles AI translation response with alternatives', () => {
    const aiResponse: TranslateResponse = {
      translatedText: 'Hallo Welt',
      detectedLang: 'en',
      provider: 'gemini',
      alternatives: [
        { text: 'Guten Tag, Welt', style: 'formal' },
        { text: 'Hi Welt', style: 'casual' },
      ],
    };

    expect(aiResponse.translatedText).toBe('Hallo Welt');
    expect(aiResponse.provider).toBe('gemini');
    expect(aiResponse.alternatives).toHaveLength(2);
    expect(aiResponse.alternatives?.[0].style).toBe('formal');
  });

  describe('toTranslatorError & errorMessageKey', () => {
    it('handles ApiClientError with rate limit code', () => {
      const apiErr = new ApiClientError('RATE_LIMITED', 429, 'Too many requests');
      const err = toTranslatorError(apiErr, 'Fallback');
      expect(err.code).toBe('RATE_LIMITED');
      expect(errorMessageKey(err.code)).toBe('errors.rate');
    });

    it('handles ApiClientError with network error', () => {
      const netErr = new ApiClientError('NETWORK', 0, 'Network failure');
      const err = toTranslatorError(netErr, 'Fallback');
      expect(err.code).toBe('NETWORK');
      expect(errorMessageKey(err.code)).toBe('errors.network');
    });

    it('handles fallback for unknown errors', () => {
      const err = toTranslatorError(new Error('Unknown crash'), 'Fallback message');
      expect(err.code).toBe('INTERNAL');
      expect(err.message).toBe('Fallback message');
      expect(errorMessageKey(err.code)).toBe('errors.unknown');
    });
  });
});
