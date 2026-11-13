import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REVEAL_DURATION, useGuessReveal } from './use-guess-reveal';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('guess presentation lifecycle', () => {
  it('blocks overlapping submissions and finishes only after the fifth flip', () => {
    vi.useFakeTimers();
    const complete = vi.fn();
    const {result} = renderHook(useGuessReveal);
    act(() => { expect(result.current.start(2, complete)).toBe(true); });
    expect(result.current.row).toBe(2);
    expect(result.current.busy.current).toBe(true);
    act(() => { expect(result.current.start(3, complete)).toBe(false); vi.advanceTimersByTime(REVEAL_DURATION - 1); });
    expect(complete).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(result.current.row).toBeNull();
    expect(result.current.busy.current).toBe(false);
  });
  it('cancels pending results on foreground entry or day change', () => {
    vi.useFakeTimers(); const complete = vi.fn();
    const {result} = renderHook(useGuessReveal);
    act(() => { result.current.start(0, complete); result.current.cancel(); vi.runAllTimers(); });
    expect(complete).not.toHaveBeenCalled();
    expect(result.current.busy.current).toBe(false);
    expect(result.current.row).toBeNull();
  });
  it('does not fire a delayed result after unmount', () => {
    vi.useFakeTimers(); const complete = vi.fn();
    const {result, unmount} = renderHook(useGuessReveal);
    act(() => { result.current.start(0, complete); });
    unmount(); act(() => { vi.runAllTimers(); });
    expect(complete).not.toHaveBeenCalled();
  });
  it('finishes without animation delay when reduced motion is requested', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({matches:true}));
    const complete = vi.fn(); const {result} = renderHook(useGuessReveal);
    act(() => { result.current.start(0, complete); vi.advanceTimersByTime(0); });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(result.current.busy.current).toBe(false);
  });
});