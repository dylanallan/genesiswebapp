import { describe, expect, it } from 'vitest';
import { platformFrom } from '../install';

describe('platformFrom', () => {
  it('spots iPhones, iPads and Android phones', () => {
    expect(platformFrom('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile Safari/604.1')).toBe('ios');
    expect(platformFrom('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) CriOS/126.0 Mobile Safari/604.1')).toBe('ios');
    expect(platformFrom('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36')).toBe('android');
  });
  it('treats an iPad asking for the desktop site as iOS, but a Mac as a computer', () => {
    const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15';
    expect(platformFrom(mac, 5)).toBe('ios');
    expect(platformFrom(mac, 0)).toBe('desktop');
    expect(platformFrom('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0')).toBe('desktop');
  });
});
