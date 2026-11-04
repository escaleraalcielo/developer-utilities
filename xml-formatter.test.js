const { formatXml, minifyXml } = require('./xml-formatter');

describe('xml-formatter', () => {
    describe('formatXml', () => {
        test('should format basic XML with spaces', () => {
            const rawXml = '<root><child>value</child></root>';
            const expectedXml = '<root>\r\n  <child>value</child>\r\n</root>';
            expect(formatXml(rawXml, '  ')).toBe(expectedXml);
        });

        test('should format basic XML with tabs', () => {
            const rawXml = '<root><child>value</child></root>';
            const expectedXml = '<root>\r\n\t<child>value</child>\r\n</root>';
            expect(formatXml(rawXml, '\t')).toBe(expectedXml);
        });

        test('should handle nested elements', () => {
            const rawXml = '<root><parent><child>value</child></parent></root>';
            const expectedXml = '<root>\r\n  <parent>\r\n    <child>value</child>\r\n  </parent>\r\n</root>';
            expect(formatXml(rawXml, '  ')).toBe(expectedXml);
        });

        test('should handle self-closing tags', () => {
            const rawXml = '<root><empty/><child>value</child></root>';
            const expectedXml = '<root>\r\n  <empty/>\r\n  <child>value</child>\r\n</root>';
            expect(formatXml(rawXml, '  ')).toBe(expectedXml);
        });

        test('should handle XML with attributes', () => {
            const rawXml = '<root id="1"><child class="test">value</child></root>';
            const expectedXml = '<root id="1">\r\n  <child class="test">value</child>\r\n</root>';
            expect(formatXml(rawXml, '  ')).toBe(expectedXml);
        });
    });

    describe('minifyXml', () => {
        test('should remove spaces between tags', () => {
            const rawXml = '<root>\r\n  <child>value</child>\r\n</root>';
            const expectedXml = '<root><child>value</child></root>';
            expect(minifyXml(rawXml)).toBe(expectedXml);
        });

        test('should handle multiple newlines and spaces', () => {
            const rawXml = '<root>    \n\n\n  <child>   value   </child>  \n  </root>';
            const expectedXml = '<root><child>   value   </child></root>';
            expect(minifyXml(rawXml)).toBe(expectedXml);
        });

        test('should preserve content within tags', () => {
            const rawXml = '<root>\n  <child>  Hello World  </child>\n</root>';
            const expectedXml = '<root><child>  Hello World  </child></root>';
            expect(minifyXml(rawXml)).toBe(expectedXml);
        });
    });
});
