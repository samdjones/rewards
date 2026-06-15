import { describe, it, expect, beforeEach } from 'vitest';
import db from '../src/db/wrapper.js';
import { getBusTimesForFamily, invalidateBusTimesCache } from '../src/utils/bustime.js';

const ATCO = 'TEST0001';
const FAMILY_ID = 1;

const insertStop = (name: string): void => {
  db.prepare('INSERT INTO bus_stops (atco_code, stop_name, refreshed_at) VALUES (?, ?, ?)').run(
    ATCO,
    name,
    new Date().toISOString()
  );
};

const insertDep = (date: string, time: string, line: string, direction: string): void => {
  db.prepare(
    'INSERT INTO bus_departures (atco_code, service_date, departure_time, line, direction) VALUES (?, ?, ?, ?, ?)'
  ).run(ATCO, date, time, line, direction);
};

describe('getBusTimesForFamily (BODS index reads)', () => {
  beforeEach(() => {
    // Cache is module-level and survives the per-test DB reset.
    invalidateBusTimesCache(FAMILY_ID);
  });

  it('returns the cached stop name', async () => {
    insertStop('Bowling Green');
    const data = await getBusTimesForFamily(FAMILY_ID, ATCO, null);
    expect(data.stop_name).toBe('Bowling Green');
  });

  it('falls back to the ATCO code when no stop name is stored', async () => {
    const data = await getBusTimesForFamily(FAMILY_ID, ATCO, null);
    expect(data.stop_name).toBe(ATCO);
  });

  it('returns upcoming departures sorted by date then time, in scheduled shape', async () => {
    insertStop('Bowling Green');
    insertDep('29991231', '09:10', '5', 'Town');
    insertDep('29991231', '09:02', '5A', 'Hove');
    insertDep('30000101', '00:05', '5', 'Depot');
    const data = await getBusTimesForFamily(FAMILY_ID, ATCO, null);
    expect(data.departures.map((d) => d.best_departure_estimate)).toEqual(['09:02', '09:10', '00:05']);
    expect(data.departures[0]).toEqual({
      line: '5A',
      direction: 'Hove',
      aimed_departure_time: '09:02',
      best_departure_estimate: '09:02',
      status: 'scheduled',
    });
  });

  it('excludes departures from past dates', async () => {
    insertStop('Bowling Green');
    insertDep('20000101', '09:00', '5', 'Town');
    insertDep('29991231', '09:00', '5', 'Town');
    const data = await getBusTimesForFamily(FAMILY_ID, ATCO, null);
    expect(data.departures).toHaveLength(1);
    expect(data.departures[0].aimed_departure_time).toBe('09:00');
  });

  it('applies the route filter (case-insensitive, comma-separated)', async () => {
    insertStop('Bowling Green');
    insertDep('29991231', '09:00', '5', 'Town');
    insertDep('29991231', '09:05', '5A', 'Town');
    insertDep('29991231', '09:10', '7', 'Elsewhere');
    const data = await getBusTimesForFamily(FAMILY_ID, ATCO, '5, 5a');
    expect(data.departures.map((d) => d.line)).toEqual(['5', '5A']);
  });

  it('limits to 6 departures', async () => {
    insertStop('Bowling Green');
    for (let i = 0; i < 10; i++) {
      insertDep('29991231', `09:${String(i).padStart(2, '0')}`, '5', 'Town');
    }
    const data = await getBusTimesForFamily(FAMILY_ID, ATCO, null);
    expect(data.departures).toHaveLength(6);
    expect(data.departures[0].aimed_departure_time).toBe('09:00');
    expect(data.departures[5].aimed_departure_time).toBe('09:05');
  });
});
