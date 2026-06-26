const {
    parseJsonWithMeta,
    jsonStats,
    formatJson,
    minifyJson,
    validateJson
} = require('./json-formatter');

describe('parseJsonWithMeta', () => {
    test('parses a simple object', () => {
        const r = parseJsonWithMeta('{"a":1}');
        expect(r.valid).toBe(true);
        expect(r.value).toEqual({ a: 1 });
    });

    test('parses a simple array', () => {
        const r = parseJsonWithMeta('[1,2,3]');
        expect(r.valid).toBe(true);
        expect(r.value).toEqual([1, 2, 3]);
    });

    test('parses null', () => {
        const r = parseJsonWithMeta('null');
        expect(r.valid).toBe(true);
        expect(r.value).toBeNull();
    });

    test('parses top-level number / boolean / string', () => {
        expect(parseJsonWithMeta('42').value).toBe(42);
        expect(parseJsonWithMeta('true').value).toBe(true);
        expect(parseJsonWithMeta('"hi"').value).toBe('hi');
    });

    test('rejects empty input with line=1, column=1', () => {
        const r = parseJsonWithMeta('');
        expect(r.valid).toBe(false);
        expect(r.line).toBe(1);
        expect(r.column).toBe(1);
    });

    test('rejects whitespace-only input', () => {
        const r = parseJsonWithMeta('   \n  ');
        expect(r.valid).toBe(false);
    });

    test('rejects trailing comma', () => {
        const r = parseJsonWithMeta('[1,2,3,]');
        expect(r.valid).toBe(false);
        expect(r.message).toMatch(/JSON/);
    });

    test('rejects single-quoted string', () => {
        const r = parseJsonWithMeta("{'a':1}");
        expect(r.valid).toBe(false);
    });

    test('rejects unquoted key', () => {
        const r = parseJsonWithMeta('{a:1}');
        expect(r.valid).toBe(false);
    });

    test('extracts line/column for an error on the first line', () => {
        const r = parseJsonWithMeta('{"a": }');
        expect(r.valid).toBe(false);
        expect(typeof r.position).toBe('number');
        expect(r.line).toBe(1);
        expect(r.column).toBeGreaterThanOrEqual(5);
    });

    test('extracts line/column for an error on a later line', () => {
        const src = '{\n  "a": 1,\n  "b":\n}';
        const r = parseJsonWithMeta(src);
        expect(r.valid).toBe(false);
        expect(typeof r.line).toBe('number');
        expect(r.line).toBeGreaterThanOrEqual(2);
    });

    test('preserves unicode in valid input', () => {
        const r = parseJsonWithMeta('{"emoji":"🚀","name":"Niño"}');
        expect(r.valid).toBe(true);
        expect(r.value.emoji).toBe('🚀');
        expect(r.value.name).toBe('Niño');
    });

    test('non-string input rejected', () => {
        const r = parseJsonWithMeta(123);
        expect(r.valid).toBe(false);
    });
});

describe('jsonStats', () => {
    test('reports bytes, lines, topType, depth for an object', () => {
        const src = '{\n  "a": 1\n}';
        const stats = jsonStats(src, { a: 1 });
        expect(stats.bytes).toBeGreaterThan(0);
        expect(stats.lines).toBe(3);
        expect(stats.topType).toBe('object');
        expect(stats.depth).toBe(1);
    });

    test('reports depth for nested arrays', () => {
        const src = '[[[1]]]';
        const stats = jsonStats(src, [[[1]]]);
        expect(stats.topType).toBe('array');
        expect(stats.depth).toBe(3);
    });

    test('topType=null for null value', () => {
        const stats = jsonStats('null', null);
        expect(stats.topType).toBe('null');
        expect(stats.depth).toBe(0);
    });

    test('depth is 1 for flat object', () => {
        const stats = jsonStats('{"a":1}', { a: 1 });
        expect(stats.depth).toBe(1);
    });

    test('depth for deeply nested object', () => {
        const value = { a: { b: { c: { d: 1 } } } };
        const stats = jsonStats(JSON.stringify(value), value);
        expect(stats.depth).toBe(4);
    });
});

describe('formatJson', () => {
    test('formats a compact object with 2-space indent', () => {
        const r = formatJson('{"a":1,"b":[1,2]}', '  ');
        expect(r.ok).toBe(true);
        expect(r.output).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
    });

    test('formats with 4-space indent', () => {
        const r = formatJson('{"a":1}', '    ');
        expect(r.output).toBe('{\n    "a": 1\n}');
    });

    test('formats with tab indent', () => {
        const r = formatJson('{"a":1}', '\t');
        expect(r.output).toBe('{\n\t"a": 1\n}');
    });

    test('default indent is 2 spaces', () => {
        const r = formatJson('{"a":1}');
        expect(r.output).toBe('{\n  "a": 1\n}');
    });

    test('formats a top-level array', () => {
        const r = formatJson('[1,2,3]', '  ');
        expect(r.output).toBe('[\n  1,\n  2,\n  3\n]');
    });

    test('rejects invalid input with error metadata', () => {
        const r = formatJson('{a:1}', '  ');
        expect(r.ok).toBe(false);
        expect(r.error.message).toMatch(/JSON/);
        expect(r.error.line).toBeGreaterThanOrEqual(1);
    });

    test('returns stats on success', () => {
        const r = formatJson('{"a":1}', '  ');
        expect(r.stats.bytes).toBeGreaterThan(0);
        expect(r.stats.topType).toBe('object');
    });
});

describe('minifyJson', () => {
    test('minifies a pretty-printed object', () => {
        const r = minifyJson('{\n  "a": 1,\n  "b": 2\n}');
        expect(r.ok).toBe(true);
        expect(r.output).toBe('{"a":1,"b":2}');
    });

    test('minifies an array', () => {
        const r = minifyJson('[\n  1,\n  2,\n  3\n]');
        expect(r.output).toBe('[1,2,3]');
    });

    test('returns input unchanged when already minified', () => {
        const r = minifyJson('{"a":1,"b":2}');
        expect(r.output).toBe('{"a":1,"b":2}');
    });

    test('preserves unicode', () => {
        const r = minifyJson('{\n  "name": "Niño"\n}');
        expect(r.output).toBe('{"name":"Niño"}');
    });

    test('rejects invalid input', () => {
        const r = minifyJson('{not json}');
        expect(r.ok).toBe(false);
        expect(r.error.message).toBeDefined();
    });
});

describe('validateJson', () => {
    test('valid object', () => {
        const r = validateJson('{"a":1}');
        expect(r.ok).toBe(true);
        expect(r.stats.topType).toBe('object');
    });

    test('valid array', () => {
        const r = validateJson('[1,2,3]');
        expect(r.ok).toBe(true);
        expect(r.stats.topType).toBe('array');
    });

    test('invalid input returns error with line/column', () => {
        const r = validateJson('{"a": ,}');
        expect(r.ok).toBe(false);
        expect(r.error.line).toBeGreaterThanOrEqual(1);
    });

    test('empty input', () => {
        const r = validateJson('');
        expect(r.ok).toBe(false);
        expect(r.error.line).toBe(1);
    });

    test('detects trailing comma', () => {
        const r = validateJson('[1,2,]');
        expect(r.ok).toBe(false);
    });

    test('detects mismatched brackets', () => {
        const r = validateJson('{"a":[1,2}');
        expect(r.ok).toBe(false);
    });
});

describe('roundtrip integrity', () => {
    test('format -> minify -> format is stable', () => {
        const original = '{"name":"Acme","active":true,"tags":["a","b","c"],"count":42,"nested":{"x":1}}';
        const formatted = formatJson(original, '  ').output;
        const minified = minifyJson(formatted).output;
        expect(minified).toBe(original);
        const reformatted = formatJson(minified, '  ').output;
        expect(reformatted).toBe(formatted);
    });
});