import { RaceWeekend } from '@/types/race';

interface Venue {
    /** Circuit or city names. Checked first. */
    specific: string[];
    /** Country names. Checked only if no circuit name matched anywhere. */
    generic: string[];
    lat: number;
    lon: number;
}

const VENUES: Venue[] = [
    { specific: ['melbourne', 'albert park'], generic: ['australia'], lat: -37.85, lon: 144.97 },
    { specific: ['shanghai'], generic: ['china'], lat: 31.34, lon: 121.22 },
    { specific: ['suzuka'], generic: ['japan'], lat: 34.84, lon: 136.54 },
    { specific: ['sakhir', 'bahrain international'], generic: ['bahrain'], lat: 26.03, lon: 50.51 },
    { specific: ['jeddah'], generic: ['saudi'], lat: 21.63, lon: 39.1 },
    { specific: ['miami'], generic: [], lat: 25.96, lon: -80.24 },
    { specific: ['montreal', 'gilles villeneuve'], generic: ['canada'], lat: 45.5, lon: -73.52 },
    { specific: ['monte carlo', 'monaco'], generic: [], lat: 43.74, lon: 7.43 },
    { specific: ['madrid', 'ifema'], generic: [], lat: 40.46, lon: -3.61 },
    { specific: ['catalunya', 'barcelona'], generic: ['spain'], lat: 41.57, lon: 2.26 },
    { specific: ['spielberg', 'red bull ring'], generic: ['austria'], lat: 47.22, lon: 14.76 },
    {
        specific: ['silverstone'],
        generic: ['great britain', 'united kingdom', 'britain'],
        lat: 52.07,
        lon: -1.02,
    },
    {
        specific: ['spa-francorchamps', 'francorchamps'],
        generic: ['belgium'],
        lat: 50.44,
        lon: 5.97,
    },
    { specific: ['hungaroring', 'budapest'], generic: ['hungary'], lat: 47.58, lon: 19.25 },
    { specific: ['zandvoort'], generic: ['netherlands'], lat: 52.39, lon: 4.54 },
    { specific: ['imola'], generic: [], lat: 44.34, lon: 11.72 },
    { specific: ['monza'], generic: ['italy'], lat: 45.62, lon: 9.29 },
    { specific: ['baku'], generic: ['azerbaijan'], lat: 40.37, lon: 49.85 },
    { specific: ['marina bay'], generic: ['singapore'], lat: 1.29, lon: 103.86 },
    { specific: ['las vegas'], generic: [], lat: 36.11, lon: -115.17 },
    {
        specific: ['austin', 'circuit of the americas'],
        generic: ['united states', 'usa'],
        lat: 30.13,
        lon: -97.64,
    },
    { specific: ['mexico', 'hermanos'], generic: [], lat: 19.4, lon: -99.09 },
    {
        specific: ['interlagos', 'sao paulo', 'são paulo'],
        generic: ['brazil'],
        lat: -23.7,
        lon: -46.7,
    },
    { specific: ['lusail', 'losail'], generic: ['qatar'], lat: 25.49, lon: 51.45 },
    {
        specific: ['yas marina', 'abu dhabi'],
        generic: ['united arab emirates', 'uae'],
        lat: 24.47,
        lon: 54.6,
    },
];

export function findVenue(weekend: Pick<RaceWeekend, 'circuit' | 'country'>) {
    const text = `${weekend.circuit} ${weekend.country}`.toLowerCase();
    const hit =
        VENUES.find((v) => v.specific.some((k) => text.includes(k))) ??
        VENUES.find((v) => v.generic.some((k) => text.includes(k)));
    return hit ? { lat: hit.lat, lon: hit.lon } : null;
}
