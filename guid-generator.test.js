const { generateGUID } = require('./guid-generator');

describe('generateGUID', () => {
    test('should return a string', () => {
        expect(typeof generateGUID()).toBe('string');
    });

    test('should match GUID v4 regex', () => {
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        for (let i = 0; i < 100; i++) {
            expect(generateGUID()).toMatch(guidRegex);
        }
    });

    test('should produce unique results', () => {
        const guids = new Set();
        const iterations = 1000;
        for (let i = 0; i < iterations; i++) {
            guids.add(generateGUID());
        }
        expect(guids.size).toBe(iterations);
    });
});
