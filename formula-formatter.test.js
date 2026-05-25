const { formatSalesforceFormula } = require('./formula-formatter');

describe('formatSalesforceFormula', () => {
    it('returns empty string for falsy inputs', () => {
        expect(formatSalesforceFormula('')).toBe('');
        expect(formatSalesforceFormula(null)).toBe('');
        expect(formatSalesforceFormula(undefined)).toBe('');
    });

    it('formats basic formula without nested structures', () => {
        const input = 'Field_A__c + Field_B__c';
        const indentStr = '    ';
        expect(formatSalesforceFormula(input, indentStr)).toBe(input);
    });

    it('formats nested formulas with commas and parentheses', () => {
        const input = 'IF(condition, true_val, false_val)';
        const indentStr = '  ';
        const expected =
`IF(
  condition,
  true_val,
  false_val
)`;
        expect(formatSalesforceFormula(input, indentStr)).toBe(expected);
    });

    it('ignores commas and parentheses inside string literals (single quotes)', () => {
        const input = "IF(Name == '(Test, User)', 'Yes, it is', 'No, not it')";
        const indentStr = '  ';
        const expected =
`IF(
  Name == '(Test, User)',
  'Yes, it is',
  'No, not it'
)`;
        expect(formatSalesforceFormula(input, indentStr)).toBe(expected);
    });

    it('ignores commas and parentheses inside string literals (double quotes)', () => {
        const input = 'IF(Name == "(Test, User)", "Yes, it is", "No, not it")';
        const indentStr = '  ';
        const expected =
`IF(
  Name == "(Test, User)",
  "Yes, it is",
  "No, not it"
)`;
        expect(formatSalesforceFormula(input, indentStr)).toBe(expected);
    });

    it('cleans up excessive spacing and newlines', () => {
        const input = `IF(
            condition,
true_val,

false_val)`;
        const indentStr = '    ';
        const expected =
`IF(
    condition,
    true_val,
    false_val
)`;
        expect(formatSalesforceFormula(input, indentStr)).toBe(expected);
    });

    it('handles different indentation strings properly', () => {
        const input = 'IF(A, B, C)';

        const indentTwoSpaces = '  ';
        const expectedTwoSpaces =
`IF(
  A,
  B,
  C
)`;
        expect(formatSalesforceFormula(input, indentTwoSpaces)).toBe(expectedTwoSpaces);

        const indentFourSpaces = '    ';
        const expectedFourSpaces =
`IF(
    A,
    B,
    C
)`;
        expect(formatSalesforceFormula(input, indentFourSpaces)).toBe(expectedFourSpaces);
    });
});
