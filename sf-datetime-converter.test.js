const {
    parseDatetime,
    getDatePartsInTimezone,
    formatSalesforceDate,
    formatSalesforceDateTimeUtc,
    formatSalesforceDateTimeAsUtc,
    formatLocalized,
    convertDatetime,
    convertDatetimeBulk,
    detectLocalTimezone,
    nowAsSalesforceUtc
} = require('./sf-datetime-converter');

describe('parseDatetime', () => {
    test('parses ISO 8601 with Z', () => {
        const r = parseDatetime('2024-01-15T10:30:00Z');
        expect(r.ok).toBe(true);
        expect(r.date.toISOString()).toBe('2024-01-15T10:30:00.000Z');
        expect(r.hadTimezone).toBe(true);
    });

    test('parses ISO 8601 with millis', () => {
        const r = parseDatetime('2024-01-15T10:30:00.123Z');
        expect(r.date.toISOString()).toBe('2024-01-15T10:30:00.123Z');
    });

    test('parses ISO 8601 with positive offset', () => {
        const r = parseDatetime('2024-01-15T10:30:00+06:00');
        expect(r.ok).toBe(true);
        expect(r.date.toISOString()).toBe('2024-01-15T04:30:00.000Z');
        expect(r.hadTimezone).toBe(true);
    });

    test('parses ISO 8601 with negative offset', () => {
        const r = parseDatetime('2024-01-15T10:30:00-05:00');
        expect(r.date.toISOString()).toBe('2024-01-15T15:30:00.000Z');
    });

    test('parses Salesforce DateTime without TZ as UTC', () => {
        const r = parseDatetime('2024-01-15 10:30:00');
        expect(r.ok).toBe(true);
        expect(r.date.toISOString()).toBe('2024-01-15T10:30:00.000Z');
        expect(r.hadTimezone).toBe(false);
        expect(r.assumedUtc).toBe(true);
    });

    test('parses Salesforce DateTime with T separator and no TZ', () => {
        const r = parseDatetime('2024-01-15T10:30:00');
        expect(r.ok).toBe(true);
        expect(r.assumedUtc).toBe(true);
    });

    test('parses date-only as midnight UTC', () => {
        const r = parseDatetime('2024-01-15');
        expect(r.ok).toBe(true);
        expect(r.date.toISOString()).toBe('2024-01-15T00:00:00.000Z');
        expect(r.assumedUtc).toBe(true);
    });

    test('parses Unix epoch in seconds (10 digits)', () => {
        const r = parseDatetime('1705314600');
        expect(r.ok).toBe(true);
        expect(r.unit).toBe('seconds');
        expect(r.date.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    test('parses Unix epoch in milliseconds (13 digits)', () => {
        const r = parseDatetime('1705314600000');
        expect(r.ok).toBe(true);
        expect(r.unit).toBe('milliseconds');
        expect(r.date.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    test('rejects empty input', () => {
        expect(parseDatetime('').ok).toBe(false);
    });

    test('rejects whitespace-only input', () => {
        expect(parseDatetime('   ').ok).toBe(false);
    });

    test('rejects garbage input', () => {
        expect(parseDatetime('not a date').ok).toBe(false);
    });

    test('rejects invalid date components', () => {
        expect(parseDatetime('2024-13-45').ok).toBe(false);
    });

    test('rejects non-string input', () => {
        expect(parseDatetime(123).ok).toBe(false);
        expect(parseDatetime(null).ok).toBe(false);
    });
});

describe('getDatePartsInTimezone', () => {
    test('UTC gives the same parts as ISO', () => {
        const d = new Date('2024-01-15T10:30:45.123Z');
        const p = getDatePartsInTimezone(d, 'UTC');
        expect(p.year).toBe('2024');
        expect(p.month).toBe('01');
        expect(p.day).toBe('15');
        expect(p.hour).toBe('10');
        expect(p.minute).toBe('30');
        expect(p.second).toBe('45');
        expect(p.fractionalSecond).toBe('123');
    });

    test('America/New_York (UTC-5 in winter)', () => {
        const d = new Date('2024-01-15T10:30:00Z');
        const p = getDatePartsInTimezone(d, 'America/New_York');
        expect(p.hour).toBe('05');
    });

    test('America/New_York (UTC-4 in summer)', () => {
        const d = new Date('2024-07-15T10:30:00Z');
        const p = getDatePartsInTimezone(d, 'America/New_York');
        expect(p.hour).toBe('06');
    });

    test('Asia/Tokyo (UTC+9)', () => {
        const d = new Date('2024-01-15T10:30:00Z');
        const p = getDatePartsInTimezone(d, 'Asia/Tokyo');
        expect(p.hour).toBe('19');
    });
});

describe('formatSalesforceDate', () => {
    test('formats in UTC', () => {
        expect(formatSalesforceDate(new Date('2024-01-15T10:30:00Z'), 'UTC')).toBe('2024-01-15');
    });

    test('formats in another timezone (rollover)', () => {
        // 2024-01-15T01:30:00Z = 2024-01-15T10:30:00 in Tokyo (+9)
        // Both stay on 2024-01-15, so it's the same date.
        const d = new Date('2024-01-15T01:30:00Z');
        expect(formatSalesforceDate(d, 'Asia/Tokyo')).toBe('2024-01-15');
    });

    test('formats with date rollover across midnight', () => {
        // 2024-01-15T20:00:00Z in America/Los_Angeles (UTC-8) = 2024-01-15T12:00:00
        const d = new Date('2024-01-15T20:00:00Z');
        expect(formatSalesforceDate(d, 'America/Los_Angeles')).toBe('2024-01-15');
        // In UTC, it's 2024-01-15T20:00:00
        expect(formatSalesforceDate(d, 'UTC')).toBe('2024-01-15');
    });

    test('rolls back a day in negative offset TZ', () => {
        // 2024-01-15T03:00:00Z in America/Los_Angeles (UTC-8) = 2024-01-14T19:00:00
        const d = new Date('2024-01-15T03:00:00Z');
        expect(formatSalesforceDate(d, 'America/Los_Angeles')).toBe('2024-01-14');
    });
});

describe('formatSalesforceDateTimeUtc', () => {
    test('always UTC with Z', () => {
        const d = new Date('2024-01-15T10:30:45.123Z');
        expect(formatSalesforceDateTimeUtc(d)).toBe('2024-01-15T10:30:45.123Z');
    });
});

describe('formatSalesforceDateTimeAsUtc', () => {
    test('emits TZ wall-clock as if UTC', () => {
        // 2024-01-15T10:30:00Z = 2024-01-15T05:30:00 in New York
        const d = new Date('2024-01-15T10:30:00Z');
        expect(formatSalesforceDateTimeAsUtc(d, 'America/New_York')).toBe('2024-01-15T05:30:00.000Z');
    });
});

describe('convertDatetime', () => {
    test('full output bundle for ISO input', () => {
        const r = convertDatetime('2024-01-15T10:30:00Z', { targetTimeZone: 'UTC' });
        expect(r.ok).toBe(true);
        expect(r.outputs.salesforceDate).toBe('2024-01-15');
        expect(r.outputs.salesforceDateTimeUtc).toBe('2024-01-15T10:30:00.000Z');
        expect(r.outputs.iso8601).toBe('2024-01-15T10:30:00.000Z');
        expect(r.outputs.unixMs).toBe('1705314600000');
        expect(r.outputs.unixSeconds).toBe('1705314600');
    });

    test('TZ-naive emits wall clock as if UTC', () => {
        const r = convertDatetime('2024-01-15T10:30:00Z', { targetTimeZone: 'America/New_York' });
        expect(r.outputs.salesforceDate).toBe('2024-01-15');
        // SF DateTime UTC is still the true UTC value.
        expect(r.outputs.salesforceDateTimeUtc).toBe('2024-01-15T10:30:00.000Z');
        // SF DateTime "as TZ" shows the wall clock in NY, labeled as Z.
        expect(r.outputs.salesforceDateTimeAsTz).toBe('2024-01-15T05:30:00.000Z');
    });

    test('assumedUtc flag set when input had no TZ', () => {
        const r = convertDatetime('2024-01-15 10:30:00');
        expect(r.ok).toBe(true);
        expect(r.parsed.assumedUtc).toBe(true);
    });

    test('parses Unix epoch seconds', () => {
        const r = convertDatetime('1705314600');
        expect(r.ok).toBe(true);
        expect(r.outputs.salesforceDate).toBe('2024-01-15');
    });

    test('error returns ok:false', () => {
        const r = convertDatetime('garbage');
        expect(r.ok).toBe(false);
    });
});

describe('convertDatetimeBulk', () => {
    test('multi-line input', () => {
        const r = convertDatetimeBulk('2024-01-15T10:30:00Z\n2024-02-20T15:45:00Z', { targetTimeZone: 'UTC' });
        expect(r.ok).toBe(true);
        expect(r.results.length).toBe(2);
        expect(r.results[0].outputs.salesforceDate).toBe('2024-01-15');
        expect(r.results[1].outputs.salesforceDate).toBe('2024-02-20');
    });

    test('handles CRLF line endings', () => {
        const r = convertDatetimeBulk('2024-01-15T10:30:00Z\r\n2024-02-20T15:45:00Z');
        expect(r.results.length).toBe(2);
    });

    test('mixes valid and invalid lines', () => {
        const r = convertDatetimeBulk('2024-01-15T10:30:00Z\ngarbage\n2024-02-20T15:45:00Z');
        expect(r.results.length).toBe(3);
        expect(r.results[0].ok).toBe(true);
        expect(r.results[1].ok).toBe(false);
        expect(r.results[2].ok).toBe(true);
    });

    test('rejects empty input', () => {
        expect(convertDatetimeBulk('').ok).toBe(false);
    });
});

describe('detectLocalTimezone', () => {
    test('returns a string', () => {
        const tz = detectLocalTimezone();
        expect(typeof tz).toBe('string');
        expect(tz.length).toBeGreaterThan(0);
    });
});

describe('nowAsSalesforceUtc', () => {
    test('returns a valid ISO 8601 string ending in Z', () => {
        const now = nowAsSalesforceUtc();
        expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
});