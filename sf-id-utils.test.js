const { isSalesforceId, to18CharId } = require('./sf-id-utils');

describe('isSalesforceId', () => {
    test('should return true for valid 15-character ID', () => {
        expect(isSalesforceId('0015500000Wv25U')).toBe(true);
    });

    test('should return true for valid 18-character ID', () => {
        expect(isSalesforceId('0015500000Wv25UAAR')).toBe(true);
    });

    test('should return false for IDs of invalid length', () => {
        expect(isSalesforceId('0015500000Wv25')).toBe(false);
        expect(isSalesforceId('0015500000Wv25UAA')).toBe(false);
        expect(isSalesforceId('0015500000Wv25UAARX')).toBe(false);
    });

    test('should return false for invalid characters', () => {
        expect(isSalesforceId('0015500000Wv25-')).toBe(false);
    });

    test('should return false for empty or null strings', () => {
        expect(isSalesforceId('')).toBe(false);
        expect(isSalesforceId(null)).toBe(false);
        expect(isSalesforceId(undefined)).toBe(false);
    });
});

describe('to18CharId', () => {
    test('should correctly convert 15-character ID to 18-character ID', () => {
        expect(to18CharId('0015500000Wv25U')).toBe('0015500000Wv25UAAR');
        expect(to18CharId('0015500000Wv25u')).toBe('0015500000Wv25uAAB');
        expect(to18CharId('003D0000001a2b3')).toBe('003D0000001a2b3IAA');
        expect(to18CharId('0015000000Wv25U')).toBe('0015000000Wv25UAAR');
    });

    test('should return the input if it is already 18 characters', () => {
        expect(to18CharId('0015500000Wv25UAAR')).toBe('0015500000Wv25UAAR');
    });

    test('should return the input if it is not 15 or 18 characters', () => {
        expect(to18CharId('0015500000Wv25')).toBe('0015500000Wv25');
    });

    test('should handle leading/trailing spaces correctly', () => {
        expect(to18CharId(' 0015500000Wv25U ')).toBe('0015500000Wv25UAAR');
    });

    test('should return empty string for null, undefined, or empty string', () => {
        expect(to18CharId('')).toBe('');
        expect(to18CharId(null)).toBe('');
        expect(to18CharId(undefined)).toBe('');
    });

    test('should correctly compute all 32 possible checksum characters', () => {
        const CHECKSUM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

        for (let i = 0; i < 32; i++) {
            let block = "";
            for (let j = 0; j < 5; j++) {
                // If the j-th bit of i is set, use an uppercase letter (adds to flag), otherwise lowercase.
                if ((i & (1 << j)) !== 0) {
                    block += 'A';
                } else {
                    block += 'a';
                }
            }

            // Repeat the block 3 times to make a 15 character ID where each chunk of 5
            // produces the identical checksum value
            const id15 = block + block + block;
            const expectedChar = CHECKSUM_CHARS.charAt(i);
            const expected18 = id15 + expectedChar + expectedChar + expectedChar;

            expect(to18CharId(id15)).toBe(expected18);
        }
    });
});
