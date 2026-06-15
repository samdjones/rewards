import { describe, it, expect } from 'vitest';
import {
  parseCsvLine,
  normaliseGtfsTime,
  addDays,
  isServiceActive,
  expandDepartures,
  emptyGtfsCollected,
  type GtfsCollected,
} from '../src/utils/gtfs.js';

describe('parseCsvLine', () => {
  it('splits a plain row', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('honours quoted fields containing commas', () => {
    expect(parseCsvLine('1,"Smith, John",x')).toEqual(['1', 'Smith, John', 'x']);
  });

  it('handles escaped double quotes', () => {
    expect(parseCsvLine('"say ""hi""",z')).toEqual(['say "hi"', 'z']);
  });

  it('preserves trailing empty fields', () => {
    expect(parseCsvLine('a,,')).toEqual(['a', '', '']);
  });
});

describe('normaliseGtfsTime', () => {
  it('keeps normal times on the same day', () => {
    expect(normaliseGtfsTime('08:05:00')).toEqual({ dayOffset: 0, hhmm: '08:05' });
  });

  it('rolls times >= 24:00 onto the next day', () => {
    expect(normaliseGtfsTime('25:30:00')).toEqual({ dayOffset: 1, hhmm: '01:30' });
  });

  it('treats exactly 24:00 as midnight next day', () => {
    expect(normaliseGtfsTime('24:00:00')).toEqual({ dayOffset: 1, hhmm: '00:00' });
  });
});

describe('addDays', () => {
  it('adds within a month', () => {
    expect(addDays('20260615', 3)).toBe('20260618');
  });

  it('rolls over month and year boundaries', () => {
    expect(addDays('20261231', 1)).toBe('20270101');
  });
});

describe('isServiceActive', () => {
  const base = (): GtfsCollected => {
    const g = emptyGtfsCollected();
    // 20260615 is a Monday; enable Mondays only.
    g.calendar.set('S1', {
      days: [true, false, false, false, false, false, false],
      start: '20260101',
      end: '20261231',
    });
    return g;
  };

  it('is active on a matching weekday within range', () => {
    expect(isServiceActive(base(), 'S1', '20260615')).toBe(true); // Monday
  });

  it('is inactive on a non-matching weekday', () => {
    expect(isServiceActive(base(), 'S1', '20260616')).toBe(false); // Tuesday
  });

  it('is inactive outside the date range', () => {
    expect(isServiceActive(base(), 'S1', '20250615')).toBe(false);
  });

  it('honours an added-date exception', () => {
    const g = base();
    g.calendarExceptions.set('S1', new Map([['20260616', 1]])); // Tuesday added
    expect(isServiceActive(g, 'S1', '20260616')).toBe(true);
  });

  it('honours a removed-date exception', () => {
    const g = base();
    g.calendarExceptions.set('S1', new Map([['20260615', 2]])); // Monday removed
    expect(isServiceActive(g, 'S1', '20260615')).toBe(false);
  });
});

describe('expandDepartures', () => {
  const build = (): GtfsCollected => {
    const g = emptyGtfsCollected();
    g.stopNames.set('ATCO1', 'Test Stop');
    g.routeShortName.set('R5', '5');
    g.routeShortName.set('R5A', '5A');
    // Daily service across the whole window.
    g.calendar.set('DAILY', {
      days: [true, true, true, true, true, true, true],
      start: '20260101',
      end: '20271231',
    });
    g.trips.set('T1', { routeId: 'R5', serviceId: 'DAILY', headsign: 'Town' });
    g.trips.set('T2', { routeId: 'R5A', serviceId: 'DAILY', headsign: 'Town' });
    g.trips.set('TLATE', { routeId: 'R5', serviceId: 'DAILY', headsign: 'Depot' });
    g.stopTimes.push({ tripId: 'T1', atco: 'ATCO1', time: '09:00:00', headsign: '' });
    g.stopTimes.push({ tripId: 'T2', atco: 'ATCO1', time: '08:30:00', headsign: 'Hove' });
    g.stopTimes.push({ tripId: 'TLATE', atco: 'ATCO1', time: '25:15:00', headsign: '' });
    return g;
  };

  it('produces sorted, dated departures across the horizon', () => {
    const out = expandDepartures(build(), { fromYmd: '20260615', horizonDays: 2 });
    // 3 departures per day * 2 days
    expect(out).toHaveLength(6);
    // First of day 1 is the 08:30 service
    expect(out[0]).toMatchObject({ date: '20260615', time: '08:30', line: '5A', direction: 'Hove' });
    expect(out[1]).toMatchObject({ date: '20260615', time: '09:00', line: '5' });
  });

  it('rolls a >24h departure onto the next calendar day', () => {
    const out = expandDepartures(build(), { fromYmd: '20260615', horizonDays: 1 });
    const late = out.find((d) => d.time === '01:15');
    expect(late).toBeDefined();
    expect(late!.date).toBe('20260616'); // service date 0615 + 1 day
  });

  it('falls back to trip headsign when stop_headsign is empty', () => {
    const out = expandDepartures(build(), { fromYmd: '20260615', horizonDays: 1 });
    const dep = out.find((d) => d.line === '5' && d.time === '09:00');
    expect(dep!.direction).toBe('Town');
  });

  it('skips trips whose route has no short name', () => {
    const g = build();
    g.stopTimes.push({ tripId: 'TX', atco: 'ATCO1', time: '10:00:00', headsign: '' });
    g.trips.set('TX', { routeId: 'UNKNOWN', serviceId: 'DAILY', headsign: '' });
    const out = expandDepartures(g, { fromYmd: '20260615', horizonDays: 1 });
    expect(out.find((d) => d.time === '10:00')).toBeUndefined();
  });
});
