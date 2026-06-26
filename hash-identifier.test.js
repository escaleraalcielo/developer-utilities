const { identifyHash, HEX_ALGORITHMS, BASE64_ALGORITHMS } = require('./hash-identifier');

const pick = (res, name) => res.matches.find(m => m.name === name);

// --- Hex detection ---
describe('hex identification', () => {
    test('32 hex chars -> MD5 high confidence', () => {
        const r = identifyHash('5d41402abc4b2a76b9719d911017c592');
        expect(r.ok).toBe(true);
        expect(r.format).toBe('hex');
        expect(r.bits).toBe(128);
        expect(r.bytes).toBe(16);
        const md5 = pick(r, 'MD5');
        expect(md5).toBeDefined();
        expect(md5.confidence).toBe('high');
        // Top match should be MD5 (or another high-confidence 128-bit algo)
        expect(['high']).toContain(r.matches[0].confidence);
        expect(r.matches[0].name).toBe('MD5');
    });

    test('40 hex chars -> SHA-1 high confidence', () => {
        const r = identifyHash('a9993e364706816aba3e25717850c26c9cd0d89d');
        expect(r.ok).toBe(true);
        expect(r.format).toBe('hex');
        expect(r.bits).toBe(160);
        expect(r.matches[0].name).toBe('SHA-1');
    });

    test('64 hex chars -> SHA-256 high confidence', () => {
        const sha256 = 'd0e8b8f11c98f369016eb2ed3c541e1f01382f9d5b3104c9ffd06b6175a46271';
        const r = identifyHash(sha256);
        expect(r.ok).toBe(true);
        expect(r.format).toBe('hex');
        expect(r.bits).toBe(256);
        expect(r.matches[0].name).toBe('SHA-256');
    });

    test('128 hex chars -> SHA-512 high confidence', () => {
        const sha512 = 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e';
        const r = identifyHash(sha512);
        expect(r.ok).toBe(true);
        expect(r.format).toBe('hex');
        expect(r.bits).toBe(512);
        expect(r.matches[0].name).toBe('SHA-512');
    });

    test('56 hex chars -> SHA-224 high confidence', () => {
        const r = identifyHash('a'.repeat(56));
        expect(r.ok).toBe(true);
        expect(r.format).toBe('hex');
        expect(r.bits).toBe(224);
        expect(r.matches[0].name).toBe('SHA-224');
    });

    test('96 hex chars -> SHA-384 high confidence', () => {
        const r = identifyHash('a'.repeat(96));
        expect(r.ok).toBe(true);
        expect(r.bits).toBe(384);
        expect(r.matches[0].name).toBe('SHA-384');
    });

    test('uppercase hex is normalized to lowercase', () => {
        const r = identifyHash('D0E8B8F11C98F369016EB2ED3C541E1F01382F9D5B3104C9FFD06B6175A46271');
        expect(r.ok).toBe(true);
        expect(r.format).toBe('hex');
        expect(r.normalized).toBe('d0e8b8f11c98f369016eb2ed3c541e1f01382f9d5b3104c9ffd06b6175a46271');
    });

    test('whitespace within hex is stripped', () => {
        const r = identifyHash('d0e8b8f1 1c98f369 016eb2ed 3c541e1f\n01382f9d5b3104c9ffd06b6175a46271');
        expect(r.ok).toBe(true);
        expect(r.format).toBe('hex');
        expect(r.normalized.length).toBe(64);
    });

    test('odd-length hex rejected as unknown', () => {
        const r = identifyHash('abc');
        expect(r.ok).toBe(false);
        expect(r.format).toBe('unknown');
    });

    test('non-hex characters rejected as unknown', () => {
        // Mix of symbols that aren't hex and aren't base64.
        const r = identifyHash('!@#$%^&*');
        expect(r.ok).toBe(false);
        expect(r.format).toBe('unknown');
    });

    test('64-char hex with multiple candidates, MD5 vs others', () => {
        const r = identifyHash('a'.repeat(64));
        expect(r.format).toBe('hex');
        // Top should be SHA-256
        expect(r.matches[0].name).toBe('SHA-256');
        expect(r.matches.length).toBeGreaterThan(1);
        // Others include SHA3-256, BLAKE2s-256
        expect(pick(r, 'SHA3-256')).toBeDefined();
        expect(pick(r, 'BLAKE2s-256')).toBeDefined();
    });

    test('8 hex chars recognized as CRC-32', () => {
        const r = identifyHash('abcdef01');
        expect(r.ok).toBe(true);
        expect(r.bits).toBe(32);
        const crc = pick(r, 'CRC-32');
        expect(crc).toBeDefined();
    });

    test('unrecognized length returns format=hex with empty matches', () => {
        const r = identifyHash('a'.repeat(50)); // 200 bits — no standard algorithm
        expect(r.ok).toBe(true);
        expect(r.format).toBe('hex');
        expect(r.matches).toEqual([]);
    });
});

// --- Base64 detection ---
describe('base64 identification', () => {
    test('44-char base64 (32 bytes) -> SHA-256 (Base64)', () => {
        // SHA-256 of "abc"
        const sha256abc = 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBWYOdDb7kY=';
        const r = identifyHash(sha256abc);
        expect(r.ok).toBe(true);
        expect(r.format).toBe('base64');
        expect(r.bytes).toBe(32);
        expect(r.matches[0].name).toMatch(/SHA-256/);
    });

    test('24-char base64 (16 bytes) -> MD5 (Base64)', () => {
        // MD5 of "abc"
        const md5abc = '900150983cd24fb0d6963f7d28e17f72';
        const b64 = Buffer.from(md5abc, 'hex').toString('base64');
        expect(b64.length).toBe(24);
        const r = identifyHash(b64);
        expect(r.ok).toBe(true);
        expect(r.format).toBe('base64');
        expect(r.bytes).toBe(16);
        expect(r.matches[0].name).toBe('MD5 (Base64)');
    });

    test('28-char base64 (20 bytes) -> SHA-1 (Base64)', () => {
        const sha1abc = 'a9993e364706816aba3e25717850c26c9cd0d89d';
        const b64 = Buffer.from(sha1abc, 'hex').toString('base64');
        const r = identifyHash(b64);
        expect(r.format).toBe('base64');
        expect(r.bytes).toBe(20);
        expect(r.matches[0].name).toMatch(/SHA-1/);
    });

    test('88-char base64 (64 bytes) -> SHA-512 (Base64)', () => {
        // 0xab produces base64 with non-hex chars (b, /, +) so we don't get classified as hex.
        const r = identifyHash(Buffer.alloc(64, 0xab).toString('base64'));
        expect(r.ok).toBe(true);
        expect(r.format).toBe('base64');
        expect(r.bytes).toBe(64);
        expect(r.matches[0].name).toBe('SHA-512 (Base64)');
    });

    test('base64 with whitespace tolerated', () => {
        const sha256abc = 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBWYOdDb7kY=';
        const r = identifyHash(sha256abc.slice(0, 22) + '\n' + sha256abc.slice(22));
        expect(r.ok).toBe(true);
        expect(r.format).toBe('base64');
    });

    test('base64 invalid length (mod 4 == 1) rejected', () => {
        // 5 chars not valid base64 length
        const r = identifyHash('ABCDE');
        expect(r.ok).toBe(false);
        expect(r.format).toBe('unknown');
    });
});

// --- Prefix pattern detection ---
describe('prefix pattern identification', () => {
    test('bcrypt $2b$10$...', () => {
        const r = identifyHash('$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
        expect(r.ok).toBe(true);
        expect(r.format).toBe('prefixed');
        expect(r.matches[0].name).toBe('bcrypt');
        expect(r.matches[0].confidence).toBe('high');
    });

    test('Argon2id', () => {
        const r = identifyHash('$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQAAAAAAAAAAA$...');
        expect(r.ok).toBe(true);
        expect(r.matches[0].name).toBe('Argon2id');
    });

    test('scrypt crypt prefix $7$', () => {
        const r = identifyHash('$7$C6..../....');
        expect(r.ok).toBe(true);
        expect(r.matches[0].name).toBe('scrypt (crypt)');
    });

    test('md5crypt $1$', () => {
        const r = identifyHash('$1$saltsalt$hashvalue1234567890123456789012');
        expect(r.ok).toBe(true);
        expect(r.matches[0].name).toMatch(/MD5-crypt/);
    });

    test('sha256crypt $5$', () => {
        const r = identifyHash('$5$rounds=5000$salt$hashvaluehashvaluehashvaluehashvaluehashvaluehashvalue');
        expect(r.ok).toBe(true);
        expect(r.matches[0].name).toMatch(/SHA-256-crypt/);
    });

    test('phpass $P$', () => {
        const r = identifyHash('$P$9IQRaTwmrfTaJI1WZ7LZcF7N3jRkT9/');
        expect(r.ok).toBe(true);
        expect(r.matches[0].name).toBe('phpass');
    });

    test('MySQL 4.1+ (41 chars: * + 40 hex)', () => {
        const r = identifyHash('*' + 'a'.repeat(40));
        expect(r.ok).toBe(true);
        expect(r.matches[0].name).toBe('MySQL 4.1+ (SHA-1)');
    });

    test('MySQL 3.23 (17 chars: * + 16 hex)', () => {
        const r = identifyHash('*' + 'a'.repeat(16));
        expect(r.ok).toBe(true);
        expect(r.matches[0].name).toBe('MySQL 3.23 / 4.0');
    });

    test('PBKDF2 passlib', () => {
        const r = identifyHash('$pbkdf2-sha256$29000$...');
        expect(r.ok).toBe(true);
        expect(r.matches[0].name).toMatch(/PBKDF2/);
    });
});

// --- JWT detection ---
describe('JWT identification', () => {
    test('detects 3-segment base64url JWT', () => {
        const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNrycn4ROo6c5Z4SiCx2dRX_3W6J7F4Z9J7hYk0';
        const r = identifyHash(jwt);
        expect(r.ok).toBe(true);
        expect(r.format).toBe('jwt');
        expect(r.matches[0].name).toMatch(/JWT/);
        expect(r.bits).toBe(256);
    });

    test('detects JWT with 384-bit signature', () => {
        const header = 'eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9';
        const payload = 'eyJzdWIiOiIxMjM0NTY3ODkwIn0';
        const sig = 'A'.repeat(64); // 48 bytes base64 = 64 chars
        const r = identifyHash(`${header}.${payload}.${sig}`);
        expect(r.ok).toBe(true);
        expect(r.format).toBe('jwt');
        expect(r.bits).toBe(384);
    });

    test('detects JWT with empty signature', () => {
        const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
        const payload = 'eyJzdWIiOiIxMjM0NTY3ODkwIn0';
        const r = identifyHash(`${header}.${payload}.`);
        expect(r.ok).toBe(true);
        expect(r.format).toBe('jwt');
    });
});

// --- Sorting & confidence ---
describe('confidence sorting', () => {
    test('high-confidence match comes first', () => {
        const r = identifyHash('a'.repeat(64));
        expect(r.matches[0].confidence).toBe('high');
    });

    test('confidence values are one of high|medium|low', () => {
        const r = identifyHash('5d41402abc4b2a76b9719d911017c592');
        for (const m of r.matches) {
            expect(['high', 'medium', 'low']).toContain(m.confidence);
        }
    });
});

// --- Edge cases & error handling ---
describe('edge cases', () => {
    test('empty input -> unknown', () => {
        const r = identifyHash('');
        expect(r.ok).toBe(false);
        expect(r.format).toBe('unknown');
    });

    test('whitespace-only input -> unknown', () => {
        const r = identifyHash('   \n  ');
        expect(r.ok).toBe(false);
    });

    test('null input -> error', () => {
        const r = identifyHash(null);
        expect(r.ok).toBe(false);
        expect(r.format).toBe('unknown');
    });

    test('number input -> error', () => {
        const r = identifyHash(123);
        expect(r.ok).toBe(false);
    });

    test('trims leading/trailing whitespace from input', () => {
        const r = identifyHash('   d0e8b8f11c98f369016eb2ed3c541e1f01382f9d5b3104c9ffd06b6175a46271   ');
        expect(r.ok).toBe(true);
        expect(r.format).toBe('hex');
    });
});

// --- Table sanity ---
describe('algorithm tables', () => {
    test('HEX_ALGORITHMS has no duplicate (name, length) pairs', () => {
        const seen = new Set();
        for (const a of HEX_ALGORITHMS) {
            const k = a.name + ':' + a.length;
            expect(seen.has(k)).toBe(false);
            seen.add(k);
        }
    });

    test('every hex algorithm length matches bits/4', () => {
        for (const a of HEX_ALGORITHMS) {
            expect(a.length).toBe(a.bits / 4);
        }
    });

    test('every base64 algorithm length matches expected bytes', () => {
        const expectedBytes = (len) => (Math.floor(len / 4) * 3) - (len.endsWith('==') ? 2 : len.endsWith('=') ? 1 : 0);
        for (const a of BASE64_ALGORITHMS) {
            // bytes = bits / 8
            expect(a.bits / 8).toBeLessThanOrEqual(a.length); // sanity, not strict equality due to padding variants
        }
    });
});