// Pure GTFS parsing / expansion helpers for the BODS timetable feed.
// No I/O here — kept side-effect free so it can be unit tested without a
// network download. busIngest.ts streams the feed and feeds rows into a
// GtfsCollected, then calls expandDepartures().

export interface CalendarEntry {
  // Index 0 = Monday ... 6 = Sunday (GTFS calendar.txt column order).
  days: boolean[];
  start: string; // YYYYMMDD
  end: string; // YYYYMMDD
}

export interface GtfsCollected {
  stopNames: Map<string, string>; // atco -> stop_name
  stopTimes: Array<{ tripId: string; atco: string; time: string; headsign: string }>;
  trips: Map<string, { routeId: string; serviceId: string; headsign: string }>;
  routeShortName: Map<string, string>; // route_id -> route_short_name
  calendar: Map<string, CalendarEntry>; // service_id -> calendar
  // service_id -> (YYYYMMDD -> exception_type: 1 added, 2 removed)
  calendarExceptions: Map<string, Map<string, number>>;
}

export const emptyGtfsCollected = (): GtfsCollected => ({
  stopNames: new Map(),
  stopTimes: [],
  trips: new Map(),
  routeShortName: new Map(),
  calendar: new Map(),
  calendarExceptions: new Map(),
});

export interface DatedDeparture {
  atco: string;
  date: string; // YYYYMMDD (real wall-clock date, after normalising >24h times)
  time: string; // HH:MM (real wall-clock time)
  line: string;
  direction: string;
}

// Parse one CSV line, honouring double-quoted fields with "" escapes.
export const parseCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
};

// "HH:MM:SS" -> { dayOffset, hours, minutes }. GTFS allows hours >= 24 to
// denote a departure after midnight on the service day (e.g. 25:30 = 01:30
// the following day).
export const normaliseGtfsTime = (
  t: string
): { dayOffset: number; hhmm: string } => {
  const [hStr, mStr] = t.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const dayOffset = Math.floor(h / 24);
  const realHour = h % 24;
  const hhmm = `${String(realHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return { dayOffset, hhmm };
};

// 0 = Monday ... 6 = Sunday for a given YYYYMMDD date string.
const mondayIndexedDow = (ymd: string): number => {
  const y = Number(ymd.slice(0, 4));
  const mo = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  // Anchor at noon UTC so adding days never trips over a DST boundary.
  const jsDow = new Date(Date.UTC(y, mo - 1, d, 12)).getUTCDay(); // 0 = Sun
  return (jsDow + 6) % 7; // shift so Monday = 0
};

// Add n days to a YYYYMMDD string, returning a new YYYYMMDD string.
export const addDays = (ymd: string, n: number): string => {
  const y = Number(ymd.slice(0, 4));
  const mo = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  const dt = new Date(Date.UTC(y, mo - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + n);
  return (
    `${dt.getUTCFullYear()}` +
    `${String(dt.getUTCMonth() + 1).padStart(2, '0')}` +
    `${String(dt.getUTCDate()).padStart(2, '0')}`
  );
};

// Is a service running on a given date, per calendar.txt + calendar_dates.txt?
export const isServiceActive = (
  g: GtfsCollected,
  serviceId: string,
  ymd: string
): boolean => {
  let active = false;
  const cal = g.calendar.get(serviceId);
  if (cal && ymd >= cal.start && ymd <= cal.end) {
    active = cal.days[mondayIndexedDow(ymd)];
  }
  // Exceptions override the weekly pattern.
  const ex = g.calendarExceptions.get(serviceId)?.get(ymd);
  if (ex === 1) active = true;
  if (ex === 2) active = false;
  return active;
};

// Expand collected GTFS into concrete dated departures for the given stops,
// across [fromYmd, fromYmd + horizonDays). Times >= 24:00 roll onto the next
// calendar day so the result is always real wall-clock date/time.
export const expandDepartures = (
  g: GtfsCollected,
  opts: { fromYmd: string; horizonDays: number }
): DatedDeparture[] => {
  const out: DatedDeparture[] = [];
  for (let i = 0; i < opts.horizonDays; i++) {
    const serviceDate = addDays(opts.fromYmd, i);
    for (const st of g.stopTimes) {
      const trip = g.trips.get(st.tripId);
      if (!trip) continue;
      if (!isServiceActive(g, trip.serviceId, serviceDate)) continue;
      const line = g.routeShortName.get(trip.routeId);
      if (!line) continue;
      const { dayOffset, hhmm } = normaliseGtfsTime(st.time);
      out.push({
        atco: st.atco,
        date: dayOffset ? addDays(serviceDate, dayOffset) : serviceDate,
        time: hhmm,
        line,
        direction: st.headsign || trip.headsign || '',
      });
    }
  }
  out.sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
  );
  return out;
};

// "now" in a given IANA timezone, as { ymd, hhmm } strings.
export const nowInZone = (
  timeZone: string,
  date: Date = new Date()
): { ymd: string; hhmm: string } => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  let hour = get('hour');
  if (hour === '24') hour = '00'; // some environments emit 24 for midnight
  return {
    ymd: `${get('year')}${get('month')}${get('day')}`,
    hhmm: `${hour}:${get('minute')}`,
  };
};
