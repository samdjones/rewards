import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { createInterface } from 'readline';
import yauzl from 'yauzl';
import { getDb, saveDatabase } from '../db/init.js';
import {
  emptyGtfsCollected,
  expandDepartures,
  nowInZone,
  parseCsvLine,
  type GtfsCollected,
} from './gtfs.js';

const GTFS_URL =
  process.env.BODS_GTFS_URL ||
  'https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/south_east/';
const HORIZON_DAYS = Number(process.env.BUS_HORIZON_DAYS) || 8;
const TIMEZONE = process.env.BUS_TIMEZONE || 'Europe/London';

// GTFS files we actually need — everything else in the zip (notably the huge
// shapes.txt) is skipped without being decompressed.
const WANTED = new Set([
  'stops.txt',
  'stop_times.txt',
  'trips.txt',
  'routes.txt',
  'calendar.txt',
  'calendar_dates.txt',
]);

let refreshing = false;

// Distinct, non-empty ATCO codes configured across all families.
export const getConfiguredAtcoCodes = (): string[] => {
  const rows = getDb().exec(
    "SELECT DISTINCT bus_stop_atco_code FROM families WHERE bus_stop_atco_code IS NOT NULL AND bus_stop_atco_code != ''"
  );
  if (!rows.length) return [];
  return rows[0].values.map((r) => String(r[0]));
};

const downloadToFile = async (url: string, dest: string): Promise<void> => {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`GTFS download failed: ${res.status} ${res.statusText}`);
  }
  await pipeline(Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]), createWriteStream(dest));
};

// Stream the wanted CSV entries out of the zip, invoking handlers[name] per row.
const streamZipCsv = (
  zipPath: string,
  handlers: Record<string, (row: Record<string, string>) => void>
): Promise<void> =>
  new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) return reject(err ?? new Error('Could not open zip'));

      zipfile.on('error', reject);
      zipfile.on('end', resolve);

      zipfile.on('entry', (entry) => {
        const handler = handlers[entry.fileName];
        if (!handler) {
          zipfile.readEntry();
          return;
        }
        zipfile.openReadStream(entry, (streamErr, stream) => {
          if (streamErr || !stream) return reject(streamErr ?? new Error('No stream'));
          const rl = createInterface({ input: stream, crlfDelay: Infinity });
          let header: string[] | null = null;
          rl.on('line', (line) => {
            if (!line) return;
            if (!header) {
              header = parseCsvLine(line);
              return;
            }
            const cells = parseCsvLine(line);
            const row: Record<string, string> = {};
            for (let i = 0; i < header.length; i++) row[header[i]] = cells[i];
            handler(row);
          });
          rl.on('close', () => zipfile.readEntry());
          stream.on('error', reject);
        });
      });

      zipfile.readEntry();
    });
  });

// Collect the rows relevant to the given stops from the GTFS zip.
const collectFromZip = async (
  zipPath: string,
  atcoSet: Set<string>
): Promise<GtfsCollected> => {
  const g = emptyGtfsCollected();
  const DAY_COLS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  await streamZipCsv(zipPath, {
    'stops.txt': (r) => {
      if (atcoSet.has(r.stop_id)) g.stopNames.set(r.stop_id, r.stop_name);
    },
    'stop_times.txt': (r) => {
      if (atcoSet.has(r.stop_id)) {
        g.stopTimes.push({
          tripId: r.trip_id,
          atco: r.stop_id,
          time: r.departure_time || r.arrival_time,
          headsign: r.stop_headsign || '',
        });
      }
    },
    'trips.txt': (r) => {
      g.trips.set(r.trip_id, {
        routeId: r.route_id,
        serviceId: r.service_id,
        headsign: r.trip_headsign || '',
      });
    },
    'routes.txt': (r) => {
      g.routeShortName.set(r.route_id, r.route_short_name);
    },
    'calendar.txt': (r) => {
      g.calendar.set(r.service_id, {
        days: DAY_COLS.map((d) => r[d] === '1'),
        start: r.start_date,
        end: r.end_date,
      });
    },
    'calendar_dates.txt': (r) => {
      let m = g.calendarExceptions.get(r.service_id);
      if (!m) {
        m = new Map();
        g.calendarExceptions.set(r.service_id, m);
      }
      m.set(r.date, Number(r.exception_type));
    },
  });

  // Drop trips not referenced by any of our stop_times to free memory.
  const usedTrips = new Set(g.stopTimes.map((s) => s.tripId));
  for (const tripId of g.trips.keys()) {
    if (!usedTrips.has(tripId)) g.trips.delete(tripId);
  }

  return g;
};

const persist = (
  atcoCodes: string[],
  stopNames: Map<string, string>,
  departures: ReturnType<typeof expandDepartures>
): void => {
  const db = getDb();
  db.run('BEGIN');
  try {
    const delDep = db.prepare('DELETE FROM bus_departures WHERE atco_code = ?');
    const delStop = db.prepare('DELETE FROM bus_stops WHERE atco_code = ?');
    for (const atco of atcoCodes) {
      delDep.run([atco]);
      delStop.run([atco]);
    }
    delDep.free();
    delStop.free();

    const insStop = db.prepare(
      'INSERT INTO bus_stops (atco_code, stop_name, refreshed_at) VALUES (?, ?, ?)'
    );
    const refreshedAt = new Date().toISOString();
    for (const atco of atcoCodes) {
      insStop.run([atco, stopNames.get(atco) ?? atco, refreshedAt]);
    }
    insStop.free();

    const insDep = db.prepare(
      'INSERT INTO bus_departures (atco_code, service_date, departure_time, line, direction) VALUES (?, ?, ?, ?, ?)'
    );
    for (const d of departures) {
      insDep.run([d.atco, d.date, d.time, d.line, d.direction]);
    }
    insDep.free();

    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
  saveDatabase();
};

export interface RefreshResult {
  skipped: boolean;
  reason?: string;
  stops?: number;
  departures?: number;
}

// Download the BODS GTFS feed and rebuild the local departure index for every
// configured stop. Safe to call concurrently — overlapping calls are ignored.
export const refreshBusData = async (): Promise<RefreshResult> => {
  if (refreshing) return { skipped: true, reason: 'already running' };

  const atcoCodes = getConfiguredAtcoCodes();
  if (atcoCodes.length === 0) {
    return { skipped: true, reason: 'no stops configured' };
  }

  refreshing = true;
  const zipPath = join(tmpdir(), `bods-gtfs-${process.pid}-${Date.now()}.zip`);
  try {
    console.log(`Refreshing bus timetable for ${atcoCodes.length} stop(s) from BODS...`);
    await downloadToFile(GTFS_URL, zipPath);

    const atcoSet = new Set(atcoCodes);
    const g = await collectFromZip(zipPath, atcoSet);

    const { ymd } = nowInZone(TIMEZONE);
    const departures = expandDepartures(g, { fromYmd: ymd, horizonDays: HORIZON_DAYS });

    persist(atcoCodes, g.stopNames, departures);
    console.log(`Bus timetable refreshed: ${departures.length} departures across ${atcoCodes.length} stop(s)`);
    return { skipped: false, stops: atcoCodes.length, departures: departures.length };
  } finally {
    refreshing = false;
    await unlink(zipPath).catch(() => {});
  }
};

// On startup, only download if the index doesn't already cover today.
export const refreshBusDataIfStale = async (): Promise<RefreshResult> => {
  const atcoCodes = getConfiguredAtcoCodes();
  if (atcoCodes.length === 0) return { skipped: true, reason: 'no stops configured' };

  const { ymd } = nowInZone(TIMEZONE);
  const row = getDb().exec(
    'SELECT MAX(service_date) FROM bus_departures'
  );
  const latest = row.length && row[0].values[0][0] ? String(row[0].values[0][0]) : null;

  // Stale if we have no data, or the newest entry is today or earlier
  // (i.e. fewer than ~2 days of runway left).
  if (latest && latest > ymd) {
    return { skipped: true, reason: 'index still current' };
  }
  return refreshBusData();
};
