import { matchDriverId, type JolpicaDriver } from '@/lib/jolpica';
import { describe, expect, it } from 'vitest';

const pool: JolpicaDriver[] = [
    { driverId: 'antonelli', givenName: 'Andrea Kimi', familyName: 'Antonelli' },
    { driverId: 'hulkenberg', givenName: 'Nico', familyName: 'Hülkenberg' },
    { driverId: 'hamilton', givenName: 'Lewis', familyName: 'Hamilton' },
];

describe('matchDriverId', () => {
    it('matches a short first name against a longer one', () => {
        expect(matchDriverId('Kimi ANTONELLI', pool)).toBe('antonelli');
    });

    it('ignores accents and letter case', () => {
        expect(matchDriverId('Nico HULKENBERG', pool)).toBe('hulkenberg');
    });

    it('does not match a different driver or an empty name', () => {
        expect(matchDriverId('Lewis Smith', pool)).toBeNull();
        expect(matchDriverId('Fernando Alonso', pool)).toBeNull();
        expect(matchDriverId('   ', pool)).toBeNull();
    });
});
