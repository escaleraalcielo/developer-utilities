const {
    bufferToHex,
    bufferToBase64,
    sha256OfString,
    sha256OfBuffer,
    verifySha256
} = require('./sha256-hash');

// --- Known SHA-256 test vectors (NIST + common references) ---
// Source: https://www.di-mgt.com.au/sha_testvectors.html

const VECTORS = [
    {
        input: '',
        hex: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
        input: 'abc',
        hex: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    },
    {
        input: 'The quick brown fox jumps over the lazy dog',
        hex: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'
    },
    {
        // 56-byte input (exact SHA-256 block boundary)
        input: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
        hex: '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
    }
];

describe('bufferToHex', () => {
    test('converts empty buffer to empty string', () => {
        expect(bufferToHex(new ArrayBuffer(0))).toBe('');
    });

    test('converts known bytes to lowercase hex', () => {
        const buf = new Uint8Array([0x00, 0x0f, 0x10, 0xff, 0xab]).buffer;
        expect(bufferToHex(buf)).toBe('000f10ffab');
    });

    test('produces 2 chars per byte', () => {
        const buf = new Uint8Array(32).buffer;
        expect(bufferToHex(buf)).toHaveLength(64);
    });
});

describe('bufferToBase64', () => {
    test('converts empty buffer to empty string', () => {
        expect(bufferToBase64(new ArrayBuffer(0))).toBe('');
    });

    test('produces valid base64 of 32-byte buffer', () => {
        const buf = new Uint8Array(32).buffer;
        const out = bufferToBase64(buf);
        expect(out).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
        expect(Buffer.from(out, 'base64')).toHaveLength(32);
    });

    test('handles buffers larger than the chunk boundary', () => {
        const buf = new Uint8Array(0x10000).buffer; // 64KB
        const out = bufferToBase64(buf);
        expect(Buffer.from(out, 'base64')).toHaveLength(0x10000);
    });
});

describe('sha256OfString', () => {
    test.each(VECTORS)('hashes "$input" to known SHA-256', async ({ input, hex }) => {
        const buf = await sha256OfString(input);
        expect(bufferToHex(buf)).toBe(hex);
    });

    test('handles unicode input', async () => {
        const buf = await sha256OfString('\u00e9\u00e8\u00ea'); // "eéèê"
        // Should not throw and should produce a 32-byte digest
        expect(new Uint8Array(buf)).toHaveLength(32);
    });
});

describe('sha256OfBuffer', () => {
    test('hash matches string variant for ASCII input', async () => {
        const text = 'hello world';
        const fromString = bufferToHex(await sha256OfString(text));
        const bytes = new TextEncoder().encode(text);
        const fromBuffer = bufferToHex(await sha256OfBuffer(bytes));
        expect(fromBuffer).toBe(fromString);
    });

    test('throws a helpful error when subtle is unavailable', async () => {
        const original = globalThis.crypto;
        // Stub crypto without .subtle to simulate an unsupported environment.
        // @ts-ignore - intentionally stripping subtle for the test.
        globalThis.crypto = {};
        try {
            await expect(sha256OfString('x')).rejects.toThrow(/Web Crypto API/);
        } finally {
            globalThis.crypto = original;
        }
    });
});

describe('verifySha256', () => {
    test('matches a correct hex hash', async () => {
        const text = 'The quick brown fox jumps over the lazy dog';
        const expected = 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592';
        await expect(verifySha256(text, expected)).resolves.toBe('match');
    });

    test('is case-insensitive on hex input', async () => {
        const text = 'abc';
        const lower = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
        const upper = lower.toUpperCase();
        await expect(verifySha256(text, upper)).resolves.toBe('match');
    });

    test('reports mismatch on a wrong hex hash', async () => {
        await expect(verifySha256('abc', 'a'.repeat(64))).resolves.toBe('mismatch');
    });

    test('reports match on correct base64 hash', async () => {
        const text = 'abc';
        const hex = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
        const expectedBase64 = Buffer.from(hex, 'hex').toString('base64');
        await expect(verifySha256(text, expectedBase64)).resolves.toBe('match');
    });

    test('reports mismatch on wrong base64 hash', async () => {
        const wrongBase64 = Buffer.alloc(32, 1).toString('base64');
        await expect(verifySha256('abc', wrongBase64)).resolves.toBe('mismatch');
    });

    test('rejects an unsupported format (too short)', async () => {
        await expect(verifySha256('abc', 'deadbeef')).resolves.toBe('unsupported-format');
    });

    test('rejects an unsupported format (non-hex 64 chars)', async () => {
        await expect(verifySha256('abc', 'z'.repeat(64))).resolves.toBe('unsupported-format');
    });

    test('rejects an unsupported format (base64 wrong length)', async () => {
        await expect(verifySha256('abc', 'aGVsbG8=')).resolves.toBe('unsupported-format'); // 8 chars, not 44
    });

    test('treats empty expected hash as invalid', async () => {
        await expect(verifySha256('abc', '')).resolves.toBe('invalid-hash');
    });

    test('treats whitespace-only expected hash as invalid', async () => {
        await expect(verifySha256('abc', '   \n  ')).resolves.toBe('invalid-hash');
    });

    test('trims surrounding whitespace on a valid hash', async () => {
        const text = 'abc';
        const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
        await expect(verifySha256(text, `  ${expected}\n`)).resolves.toBe('match');
    });
});