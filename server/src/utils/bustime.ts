import db from '../db/wrapper.js';
import { nowInZone } from './gtfs.js';

interface BusDeparture {
  line: string;
  direction: string;
  aimed_departure_time: string;
  best_departure_estimate: string;
  status: string;
}

interface BusTimesCache {
  stop_name: string;
  departures: BusDeparture[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const TIMEZONE = process.env.BUS_TIMEZONE || 'Europe/London';
const MAX_DEPARTURES = 6;

const busTimesCache = new Map<number, BusTimesCache>();

export const invalidateBusTimesCache = (familyId: number): void => {
  busTimesCache.delete(familyId);
};

// Read upcoming departures for a stop from the locally-built BODS index.
// Scheduled-only: best_departure_estimate mirrors the aimed time and status
// is always "scheduled" (no live vehicle tracking).
export const getBusTimesForFamily = async (
  familyId: number,
  atcoCode: string,
  routeFilter: string | null
): Promise<{ stop_name: string; departures: BusDeparture[] }> => {
  const cached = busTimesCache.get(familyId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { stop_name: cached.stop_name, departures: cached.departures };
  }

  const stopRow = db
    .prepare<{ stop_name: string }>('SELECT stop_name FROM bus_stops WHERE atco_code = ?')
    .get(atcoCode);
  const stopName = stopRow?.stop_name || atcoCode;

  const { ymd, hhmm } = nowInZone(TIMEZONE);

  const routes = (routeFilter ?? '')
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);

  // Upcoming = later today, or any future day in the index. Crossing midnight
  // is handled naturally by ordering on (service_date, departure_time).
  let sql =
    `SELECT line, direction, departure_time FROM bus_departures ` +
    `WHERE atco_code = ? AND (service_date > ? OR (service_date = ? AND departure_time >= ?))`;
  const params: (string | number)[] = [atcoCode, ymd, ymd, hhmm];

  if (routes.length) {
    sql += ` AND LOWER(line) IN (${routes.map(() => '?').join(',')})`;
    params.push(...routes);
  }

  sql += ` ORDER BY service_date, departure_time LIMIT ?`;
  params.push(MAX_DEPARTURES);

  const rows = db
    .prepare<{ line: string; direction: string; departure_time: string }>(sql)
    .all(...params);

  const departures: BusDeparture[] = rows.map((r) => ({
    line: r.line,
    direction: r.direction,
    aimed_departure_time: r.departure_time,
    best_departure_estimate: r.departure_time,
    status: 'scheduled',
  }));

  busTimesCache.set(familyId, { stop_name: stopName, departures, fetchedAt: Date.now() });
  return { stop_name: stopName, departures };
};
