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

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const busTimesCache = new Map<number, BusTimesCache>();

export const invalidateBusTimesCache = (familyId: number): void => {
  busTimesCache.delete(familyId);
};

export const getBusTimesForFamily = async (
  familyId: number,
  atcoCode: string,
  routeFilter: string | null
): Promise<{ stop_name: string; departures: BusDeparture[] }> => {
  const cached = busTimesCache.get(familyId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { stop_name: cached.stop_name, departures: cached.departures };
  }

  const appId = process.env.TRANSPORT_API_APP_ID;
  const appKey = process.env.TRANSPORT_API_APP_KEY;

  if (!appId || !appKey) {
    throw new Error('TransportAPI credentials not configured');
  }

  const url =
    `https://transportapi.com/v3/uk/bus/stop/${encodeURIComponent(atcoCode)}/live.json` +
    `?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}` +
    `&group=route&nextbuses=yes`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TransportAPI request failed: ${res.status}`);
  }

  const data = await res.json() as {
    stop_name?: string;
    departures?: Record<string, Array<{
      line: string;
      direction: string;
      aimed_departure_time: string;
      best_departure_estimate: string;
      status?: string;
    }>>;
  };

  const stopName = data.stop_name || atcoCode;

  // Flatten departures from all routes
  let allDepartures: BusDeparture[] = [];
  if (data.departures) {
    for (const routeDeps of Object.values(data.departures)) {
      for (const dep of routeDeps) {
        allDepartures.push({
          line: dep.line,
          direction: dep.direction,
          aimed_departure_time: dep.aimed_departure_time,
          best_departure_estimate: dep.best_departure_estimate,
          status: dep.status || 'scheduled',
        });
      }
    }
  }

  // Filter by route if set
  if (routeFilter) {
    const routes = routeFilter.split(',').map(r => r.trim().toLowerCase());
    allDepartures = allDepartures.filter(d => routes.includes(d.line.toLowerCase()));
  }

  // Sort by best_departure_estimate time
  allDepartures.sort((a, b) => a.best_departure_estimate.localeCompare(b.best_departure_estimate));

  // Limit to 6 departures
  const departures = allDepartures.slice(0, 6);

  const result: BusTimesCache = { stop_name: stopName, departures, fetchedAt: Date.now() };
  busTimesCache.set(familyId, result);

  return { stop_name: stopName, departures };
};
