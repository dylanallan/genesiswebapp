import { describe, expect, it } from 'vitest';
import { fade, fitInside, pickVideoType, secondsPerSlide, slideAt, totalSeconds, wrapLines, zoom } from '../slideshow';

describe('timing', () => {
  it('spreads photos over the narration, but never faster than 3 seconds each', () => {
    expect(secondsPerSlide(4, 44, 5)).toBe(10);
    expect(secondsPerSlide(20, 30, 5)).toBe(3);
    expect(secondsPerSlide(4, null, 6)).toBe(6);
    expect(secondsPerSlide(4, null, 1)).toBe(3);
    expect(secondsPerSlide(0, 30, 5)).toBe(0);
  });
  it('lasts as long as the photos or the narration, whichever is longer', () => {
    expect(totalSeconds(3, 5, null)).toBe(19);
    expect(totalSeconds(3, 3, 60)).toBe(60);
  });
  it('shows the title first, then each photo in turn, holding the last one', () => {
    expect(slideAt(2, 3, 5)).toEqual({ index: -1, progress: 0.5 });
    expect(slideAt(4, 3, 5)).toEqual({ index: 0, progress: 0 });
    expect(slideAt(11.5, 3, 5)).toEqual({ index: 1, progress: 0.5 });
    expect(slideAt(100, 3, 5)).toEqual({ index: 2, progress: 1 });
  });
});

describe('framing', () => {
  it('zooms gently, alternating in and out', () => {
    expect(zoom(0, 0)).toBe(1);
    expect(zoom(0, 1)).toBeCloseTo(1.08);
    expect(zoom(1, 0)).toBeCloseTo(1.08);
    expect(zoom(1, 1)).toBe(1);
  });
  it('shows the whole photo, centred', () => {
    expect(fitInside(1000, 1000, 1280, 720)).toEqual({ x: 280, y: 0, w: 720, h: 720 });
    expect(fitInside(2000, 500, 1000, 1000)).toEqual({ x: 0, y: 375, w: 1000, h: 250 });
  });
  it('fades in and out at the edges', () => {
    expect(fade(0, 5)).toBe(0);
    expect(fade(0.5, 5)).toBe(1);
    expect(fade(1, 5)).toBe(0);
  });
});

describe('captions and format', () => {
  const measure = (s: string) => s.length * 10;
  it('wraps a caption and shortens one that is far too long', () => {
    expect(wrapLines('Rosa and Luis on their wedding day', 170, measure)).toEqual(['Rosa and Luis on', 'their wedding day']);
    expect(wrapLines('one two three four five six seven eight', 90, measure, 2)).toEqual(['one two', 'three…']);
    expect(wrapLines('   ', 100, measure)).toEqual([]);
  });
  it('picks the first format the browser can record', () => {
    expect(pickVideoType((m) => m.startsWith('video/webm'))).toBe('video/webm;codecs=vp9,opus');
    expect(pickVideoType((m) => m === 'video/mp4')).toBe('video/mp4');
    expect(pickVideoType(() => false)).toBeNull();
  });
});
