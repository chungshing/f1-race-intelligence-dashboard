const MINUTE = 60 * 1000;

// How long cached data counts as fresh. Your data only changes when a sync runs
// (about once a week), so these can be long. A stale query is still shown instantly
// and refreshed in the background the next time a page asks for it.
export const STALE = {
    standings: 10 * MINUTE,
    schedule: 60 * MINUTE,
    results: 10 * MINUTE,
    meeting: 30 * MINUTE,
};

// How long data is kept in memory and in the browser's IndexedDB between visits.
export const CACHE_MAX_AGE = 24 * 60 * MINUTE;
