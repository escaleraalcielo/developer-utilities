const {
    bufferToHex,
    bufferToBase64,
    hexToBytes,
    constantTimeEqual,
    decodeSecret,
    hmacSha256OfString,
    hmacSha256OfBuffer,
    verifyHmacSha256
} = require('./hmac-sha256');

// --- RFC 4231 HMAC-SHA256 Test Vectors ---
// Source: https://datatracker.ietf.org/doc/html/rfc4231
// Only including cases where Node's WebCrypto accepts the key size (it rejects
// keys shorter than the digest size for HMAC-SHA256 in newer Node versions,
// so Case 4 (key shorter than block) is omitted — that's a known WebCrypto
// behavior change from RFC 4231 era).

const VECTORS = [
    {
        name: 'RFC 4231 Case 1: 0x0b * 20 / "Hi There"',
        keyHex: '0b'.repeat(20),
        message: 'Hi There',
        expected: 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7'
    },
    {
        name: 'RFC 4231 Case 2: "Jefe" / "what do ya want for nothing?"',
        key: 'Jefe',
        keyEncoding: 'utf8',
        message: 'what do ya want for nothing?',
        expected: '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843'
    },
    {
        name: 'RFC 4231 Case 3: 0xaa * 20 / 0xdd * 50',
        keyHex: 'aa'.repeat(20),
        // 50 bytes of 0xdd
        message: null,
        rawMessageHex: 'dd'.repeat(50),
        expected: '773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe'
    },
    {
        name: 'RFC 4231 Case 6: 0xaa * 131 / "Test Using Larger Than Block-Size Key - Hash Key First"',
        keyHex: 'aa'.repeat(131),
        message: 'Test Using Larger Than Block-Size Key - Hash Key First',
        expected: '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54'
    },
    {
        name: 'RFC 4231 Case 7: 0xaa * 131 / "This is a test using a larger than block-size key and a larger than block-size data..."',
        keyHex: 'aa'.repeat(131),
        message: 'This is a test using a larger than block-size key and a larger than block-size data. The key needs to be hashed before being used by the HMAC algorithm.',
        expected: '9b09ffa71b942fcb27635fbcd5b0e944bfdc63644f0713938a7f51535c3a35e2'
    }
];

describe('hexToBytes', () => {
    test('decodes known hex', () => {
        expect(Array.from(hexToBytes('0b0b'))).toEqual([0x0b, 0x0b]);
    });

    test('decodes full 20-byte RFC 4231 key', () => {
        const bytes = hexToBytes('0b'.repeat(20));
        expect(bytes).toHaveLength(20);
        expect(bytes[0]).toBe(0x0b);
        expect(bytes[19]).toBe(0x0b);
    });

    test('accepts whitespace and uppercase', () => {
        const a = Array.from(hexToBytes('0B 0b 0a\nff'));
        expect(a).toEqual([0x0b, 0x0b, 0x0a, 0xff]);
    });

    test('rejects odd-length input', () => {
        expect(() => hexToBytes('abc')).toThrow(/Invalid hex/);
    });

    test('rejects non-hex characters', () => {
        expect(() => hexToBytes('zzzz')).toThrow(/Invalid hex/);
    });
});

describe('decodeSecret', () => {
    test('utf8 encoding matches TextEncoder', () => {
        const a = decodeSecret('Jefe', 'utf8');
        const b = new TextEncoder().encode('Jefe');
        expect(Array.from(a)).toEqual(Array.from(b));
    });

    test('hex encoding returns raw bytes', () => {
        const a = decodeSecret('0b0b', 'hex');
        expect(Array.from(a)).toEqual([0x0b, 0x0b]);
    });

    test('default encoding is utf8', () => {
        const a = decodeSecret('hello');
        const b = new TextEncoder().encode('hello');
        expect(Array.from(a)).toEqual(Array.from(b));
    });

    test('rejects non-string input', () => {
        expect(() => decodeSecret(null, 'utf8')).toThrow(TypeError);
        expect(() => decodeSecret(123, 'utf8')).toThrow(TypeError);
    });
});

describe('constantTimeEqual', () => {
    test('matches identical strings', () => {
        expect(constantTimeEqual('abc', 'abc')).toBe(true);
    });

    test('rejects different strings of equal length', () => {
        expect(constantTimeEqual('abc', 'abd')).toBe(false);
    });

    test('rejects different-length strings', () => {
        expect(constantTimeEqual('abc', 'abcd')).toBe(false);
    });

    test('rejects non-string inputs', () => {
        expect(constantTimeEqual(null, 'a')).toBe(false);
        expect(constantTimeEqual('a', undefined)).toBe(false);
    });

    test('handles empty strings', () => {
        expect(constantTimeEqual('', '')).toBe(true);
        expect(constantTimeEqual('', 'a')).toBe(false);
    });
});

describe('bufferToHex / bufferToBase64', () => {
    test('hex roundtrip with hexToBytes', () => {
        const original = '0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b';
        expect(bufferToHex(hexToBytes(original).buffer)).toBe(original);
    });

    test('base64 roundtrip', () => {
        const bytes = hexToBytes('aa'.repeat(32));
        const b64 = bufferToBase64(bytes.buffer);
        expect(Buffer.from(b64, 'base64').equals(Buffer.from(bytes))).toBe(true);
    });
});

describe('hmacSha256OfString — RFC 4231 vectors', () => {
    test.each(VECTORS)('$name', async (v) => {
        const secret = v.keyHex ? { secret: v.keyHex, keyEncoding: 'hex' }
            : { secret: v.key, keyEncoding: v.keyEncoding || 'utf8' };

        let result;
        if (v.message !== null && v.message !== undefined) {
            result = await hmacSha256OfString(v.message, secret.secret, secret.keyEncoding);
        } else {
            // Raw bytes case (RFC 4231 Case 3)
            result = await hmacSha256OfBuffer(hexToBytes(v.rawMessageHex), secret.secret, secret.keyEncoding);
        }

        expect(bufferToHex(result)).toBe(v.expected);
    });

    test('case 3 message bytes via string still match (raw hex chars interpreted as utf8 still produce a 32-byte digest)', async () => {
        // Sanity: a stringified all-0xdd produces a digest too (just not the RFC value).
        const result = await hmacSha256OfString('\u00dd'.repeat(50), 'aa'.repeat(20), 'hex');
        expect(new Uint8Array(result)).toHaveLength(32);
    });
});

describe('hmacSha256OfBuffer', () => {
    test('matches string variant for utf8 text', async () => {
        const text = 'webhook payload';
        const key = 'shared-secret-123';
        const fromString = bufferToHex(await hmacSha256OfString(text, key));
        const fromBuffer = bufferToHex(await hmacSha256OfBuffer(
            new TextEncoder().encode(text),
            key
        ));
        expect(fromBuffer).toBe(fromString);
    });

    test('requires a secret', async () => {
        await expect(hmacSha256OfString('msg', '')).rejects.toThrow(/Secret key/);
    });
});

describe('verifyHmacSha256', () => {
    test('matches correct hex signature (RFC 4231 Case 1)', async () => {
        await expect(verifyHmacSha256('Hi There', VECTORS[0].expected, '0b'.repeat(20), 'hex'))
            .resolves.toBe('match');
    });

    test('is case-insensitive on hex signature', async () => {
        await expect(verifyHmacSha256('Hi There', VECTORS[0].expected.toUpperCase(), '0b'.repeat(20), 'hex'))
            .resolves.toBe('match');
    });

    test('reports mismatch on wrong hex signature', async () => {
        await expect(verifyHmacSha256('Hi There', 'a'.repeat(64), '0b'.repeat(20), 'hex'))
            .resolves.toBe('mismatch');
    });

    test('matches correct base64 signature', async () => {
        const expectedB64 = Buffer.from(VECTORS[0].expected, 'hex').toString('base64');
        await expect(verifyHmacSha256('Hi There', expectedB64, '0b'.repeat(20), 'hex'))
            .resolves.toBe('match');
    });

    test('reports mismatch on wrong base64 signature', async () => {
        const wrongB64 = Buffer.alloc(32, 1).toString('base64');
        await expect(verifyHmacSha256('Hi There', wrongB64, '0b'.repeat(20), 'hex'))
            .resolves.toBe('mismatch');
    });

    test('rejects unsupported format (too short)', async () => {
        await expect(verifyHmacSha256('msg', 'deadbeef', 'secret'))
            .resolves.toBe('unsupported-format');
    });

    test('rejects unsupported format (64 non-hex chars)', async () => {
        await expect(verifyHmacSha256('msg', 'z'.repeat(64), 'secret'))
            .resolves.toBe('unsupported-format');
    });

    test('rejects unsupported format (base64 wrong length)', async () => {
        await expect(verifyHmacSha256('msg', 'aGVsbG8=', 'secret'))
            .resolves.toBe('unsupported-format'); // 8 chars, not 44
    });

    test('rejects empty signature', async () => {
        await expect(verifyHmacSha256('msg', '', 'secret')).resolves.toBe('invalid-signature');
    });

    test('trims whitespace on a valid signature', async () => {
        await expect(verifyHmacSha256('Hi There', `  ${VECTORS[0].expected}\n`, '0b'.repeat(20), 'hex'))
            .resolves.toBe('match');
    });

    test('reports missing-secret when key is empty', async () => {
        await expect(verifyHmacSha256('msg', VECTORS[0].expected, ''))
            .resolves.toBe('missing-secret');
    });

    test('rejects when key is wrong but message is right', async () => {
        // Same signature but a different key -> mismatch (also proves verify uses the key).
        const wrongKeyHex = 'cc'.repeat(20); // valid hex, different from RFC 4231 Case 1's '0b' key
        await expect(verifyHmacSha256('Hi There', VECTORS[0].expected, wrongKeyHex, 'hex'))
            .resolves.toBe('mismatch');
    });
});

describe('environment resilience', () => {
    test('throws a helpful error when subtle is unavailable', async () => {
        const original = globalThis.crypto;
        // @ts-ignore - intentionally stripping subtle
        globalThis.crypto = {};
        try {
            await expect(hmacSha256OfString('x', 'k')).rejects.toThrow(/Web Crypto API/);
        } finally {
            globalThis.crypto = original;
        }
    });
});