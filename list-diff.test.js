const { parseInput } = require('./list-diff');

describe('parseInput', () => {
    test('should return an empty array for empty, null, or undefined input', () => {
        expect(parseInput('', false, false)).toEqual([]);
        expect(parseInput(null, false, false)).toEqual([]);
        expect(parseInput(undefined, false, false)).toEqual([]);
    });

    test('should split input by newline (LF)', () => {
        const input = 'line1\nline2\nline3';
        const expected = ['line1', 'line2', 'line3'];
        expect(parseInput(input, false, false)).toEqual(expected);
    });

    test('should split input by newline (CRLF)', () => {
        const input = 'line1\r\nline2\r\nline3';
        const expected = ['line1', 'line2', 'line3'];
        expect(parseInput(input, false, false)).toEqual(expected);
    });

    test('should trim lines when shouldTrim is true', () => {
        const input = '  line1  \n  line2  ';
        const expected = ['line1', 'line2'];
        expect(parseInput(input, true, false)).toEqual(expected);
    });

    test('should not trim lines when shouldTrim is false', () => {
        const input = '  line1  \n  line2  ';
        const expected = ['  line1  ', '  line2  '];
        expect(parseInput(input, false, false)).toEqual(expected);
    });

    test('should remove empty lines when shouldRemoveEmpty is true', () => {
        const input = 'line1\n\nline2\n';
        const expected = ['line1', 'line2'];
        expect(parseInput(input, false, true)).toEqual(expected);
    });

    test('should not remove empty lines when shouldRemoveEmpty is false', () => {
        const input = 'line1\n\nline2';
        const expected = ['line1', '', 'line2'];
        expect(parseInput(input, false, false)).toEqual(expected);
    });

    test('should handle both trimming and removing empty lines', () => {
        const input = '  line1  \n  \n  line2  \n  ';
        // If shouldTrim is true, '  ' becomes ''
        // If shouldRemoveEmpty is true, '' lines are removed
        const expected = ['line1', 'line2'];
        expect(parseInput(input, true, true)).toEqual(expected);
    });

    test('should keep whitespace-only lines when shouldTrim is false and shouldRemoveEmpty is true', () => {
        const input = 'line1\n  \nline2';
        const expected = ['line1', '  ', 'line2'];
        expect(parseInput(input, false, true)).toEqual(expected);
    });

    test('should handle single line input', () => {
        const input = 'line1';
        const expected = ['line1'];
        expect(parseInput(input, false, false)).toEqual(expected);
    });
});
