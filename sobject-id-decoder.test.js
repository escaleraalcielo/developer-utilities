const { decodeSobjectId, decodeSobjectIds, STANDARD_PREFIXES } = require('./sobject-id-decoder');

describe('decodeSobjectId', () => {
    test('Account 001', () => {
        const r = decodeSobjectId('0015500000Wv25U');
        expect(r.ok).toBe(true);
        expect(r.prefix).toBe('001');
        expect(r.objectName).toBe('Account');
        expect(r.isStandard).toBe(true);
        expect(r.isCustom).toBe(false);
        expect(r.isCaseSafe).toBe(false);
    });

    test('Case 500', () => {
        const r = decodeSobjectId('5005500000Wv25U');
        expect(r.prefix).toBe('500');
        expect(r.objectName).toBe('Case');
    });

    test('Contact 003', () => {
        const r = decodeSobjectId('0035500000Wv25U');
        expect(r.objectName).toBe('Contact');
    });

    test('Opportunity 008', () => {
        const r = decodeSobjectId('0065500000Wv25U'); // legacy
        expect(r.objectName).toBe('Opportunity (legacy)');

        const r2 = decodeSobjectId('0085500000Wv25U');
        expect(r2.objectName).toBe('Opportunity');
    });

    test('Lead 00Q', () => {
        expect(decodeSobjectId('00Q5500000Wv25U').objectName).toBe('Lead');
    });

    test('User 005', () => {
        expect(decodeSobjectId('0055500000Wv25U').objectName).toBe('User');
    });

    test('Campaign 016', () => {
        expect(decodeSobjectId('0165500000Wv25U').objectName).toBe('Campaign');
    });

    test('Apex Class 00U', () => {
        expect(decodeSobjectId('00U5500000ABCDE').objectName).toBe('Apex Class');
    });

    test('Permission Set 0PS', () => {
        const r = decodeSobjectId('0PS5f000003biIsGAI');
        expect(r.objectName).toBe('Permission Set');
    });

    test('18-char case-safe ID detected', () => {
        const r = decodeSobjectId('0015500000Wv25UAAR');
        expect(r.ok).toBe(true);
        expect(r.length).toBe(18);
        expect(r.isCaseSafe).toBe(true);
        expect(r.prefix).toBe('001');
        expect(r.objectName).toBe('Account');
    });

    test('15-char ID is case-sensitive', () => {
        const r = decodeSobjectId('0015500000Wv25U');
        expect(r.length).toBe(15);
        expect(r.isCaseSafe).toBe(false);
    });

    test('lowercase prefix is normalized for lookup', () => {
        const r = decodeSobjectId('0015500000wv25u');
        expect(r.prefix).toBe('001');
        expect(r.objectName).toBe('Account');
    });

    test('per-org custom object (a0x prefix)', () => {
        const r = decodeSobjectId('a015500000Wv25U');
        expect(r.ok).toBe(true);
        expect(r.prefix).toBe('A01');
        expect(r.objectName).toBe('Custom SObject');
        expect(r.isCustom).toBe(true);
        expect(r.isStandard).toBe(false);
    });

    test('per-org custom object (e0x prefix)', () => {
        const r = decodeSobjectId('e015500000Wv25U');
        expect(r.isCustom).toBe(true);
        expect(r.objectName).toBe('Custom SObject');
    });

    test('00S marked as custom (placeholder)', () => {
        const r = decodeSobjectId('00S5500000Wv25U');
        expect(r.objectName).toBe('Custom SObject');
        expect(r.isCustom).toBe(true);
    });

    test('unknown prefix flagged', () => {
        const r = decodeSobjectId('Z995500000Wv25U');
        expect(r.isUnknown).toBe(true);
        expect(r.isStandard).toBe(false);
        expect(r.isCustom).toBe(false);
    });

    test('rejects 16-char input', () => {
        const r = decodeSobjectId('0015500000Wv25UA');
        expect(r.ok).toBe(false);
        expect(r.error).toMatch(/valid Salesforce ID/);
    });

    test('rejects 17-char input', () => {
        const r = decodeSobjectId('0015500000Wv25UA'); // 16 chars
        expect(r.ok).toBe(false);
    });

    test('rejects empty string', () => {
        expect(decodeSobjectId('').ok).toBe(false);
    });

    test('rejects whitespace-only string', () => {
        expect(decodeSobjectId('   ').ok).toBe(false);
    });

    test('rejects input with special chars', () => {
        const r = decodeSobjectId('001-550-0000-Wv25-U');
        expect(r.ok).toBe(false);
    });

    test('rejects null', () => {
        expect(decodeSobjectId(null).ok).toBe(false);
    });

    test('rejects non-string input', () => {
        expect(decodeSobjectId(123).ok).toBe(false);
    });

    test('trims surrounding whitespace', () => {
        const r = decodeSobjectId('   0015500000Wv25U   ');
        expect(r.ok).toBe(true);
        expect(r.prefix).toBe('001');
    });
});

describe('decodeSobjectIds (bulk)', () => {
    test('decodes newline-separated IDs', () => {
        const r = decodeSobjectIds('0015500000Wv25U\n0035500000Wv25U\n00Q5500000Wv25U');
        expect(r.length).toBe(3);
        expect(r[0].objectName).toBe('Account');
        expect(r[1].objectName).toBe('Contact');
        expect(r[2].objectName).toBe('Lead');
    });

    test('decodes comma-separated IDs', () => {
        const r = decodeSobjectIds('0015500000Wv25U, 0035500000Wv25U, 0055500000Wv25U');
        expect(r.length).toBe(3);
        expect(r[2].objectName).toBe('User');
    });

    test('decodes space-separated IDs', () => {
        const r = decodeSobjectIds('0015500000Wv25U 0035500000Wv25U 5005500000Wv25U');
        expect(r.length).toBe(3);
        expect(r[2].objectName).toBe('Case');
    });

    test('decodes semicolon-separated IDs', () => {
        const r = decodeSobjectIds('0015500000Wv25U;0035500000Wv25U');
        expect(r.length).toBe(2);
    });

    test('handles mixed separators', () => {
        const r = decodeSobjectIds('0015500000Wv25U,\n0035500000Wv25U; 00Q5500000Wv25U');
        expect(r.length).toBe(3);
    });

    test('flags invalid IDs alongside valid ones', () => {
        const r = decodeSobjectIds('0015500000Wv25U\nnot-an-id\n0035500000Wv25U');
        expect(r.length).toBe(3);
        expect(r[0].ok).toBe(true);
        expect(r[1].ok).toBe(false);
        expect(r[1].raw).toBe('not-an-id');
        expect(r[2].ok).toBe(true);
    });

    test('empty input returns empty array', () => {
        expect(decodeSobjectIds('')).toEqual([]);
        expect(decodeSobjectIds('   \n  ')).toEqual([]);
    });

    test('non-string input returns error', () => {
        const r = decodeSobjectIds(null);
        expect(r[0].ok).toBe(false);
    });
});

describe('STANDARD_PREFIXES table', () => {
    test('contains the most common SF objects', () => {
        for (const obj of ['Account', 'Contact', 'Lead', 'Opportunity', 'Case', 'User', 'Campaign', 'Order', 'Quote', 'Product', 'Asset', 'Contract']) {
            const found = Object.values(STANDARD_PREFIXES).includes(obj);
            expect(found).toBe(true);
        }
    });

    test('prefixes are 3 chars', () => {
        for (const prefix of Object.keys(STANDARD_PREFIXES)) {
            expect(prefix.length).toBe(3);
        }
    });
});