import { WeatherKind } from '@/lib/weather';
import {
    Cloud,
    CloudDrizzle,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSnow,
    CloudSun,
    Sun,
    type LucideIcon,
} from 'lucide-react';

export const WEATHER_ICONS: Record<WeatherKind, LucideIcon> = {
    clear: Sun,
    partly: CloudSun,
    cloud: Cloud,
    fog: CloudFog,
    drizzle: CloudDrizzle,
    rain: CloudRain,
    snow: CloudSnow,
    storm: CloudLightning,
};
