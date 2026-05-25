const { generateApiName } = require('./api-name-generator.js');

describe('generateApiName', () => {
    test('handles normal inputs without special characters', () => {
        expect(generateApiName('AccountName', '__c')).toBe('AccountName__c');
        expect(generateApiName('MyCustomObject', '')).toBe('MyCustomObject');
    });

    test('replaces accented characters with basic Latin equivalents', () => {
        expect(generateApiName('Café', '__c')).toBe('Cafe__c');
        expect(generateApiName('Niño', '__c')).toBe('Nino__c');
    });

    test('replaces non-alphanumeric characters with underscores', () => {
        expect(generateApiName('My Custom Object!', '__c')).toBe('My_Custom_Object__c');
        expect(generateApiName('hello-world', '__c')).toBe('hello_world__c');
    });

    test('removes consecutive underscores', () => {
        expect(generateApiName('My   Custom   Object', '__c')).toBe('My_Custom_Object__c');
        expect(generateApiName('A--B', '__c')).toBe('A_B__c');
    });

    test('prefixes with X if starting with a number', () => {
        expect(generateApiName('1stObject', '__c')).toBe('X1stObject__c');
    });

    test('removes leading underscores and checks for number', () => {
        expect(generateApiName('_MyObject', '__c')).toBe('MyObject__c');
        expect(generateApiName('__2ndObject', '__c')).toBe('X2ndObject__c');
        expect(generateApiName('___3rd Object', '__c')).toBe('X3rd_Object__c');
    });

    test('removes trailing underscores before appending suffix', () => {
        expect(generateApiName('MyObject_', '__c')).toBe('MyObject__c');
        expect(generateApiName('MyObject__', '__c')).toBe('MyObject__c');
        expect(generateApiName('My Object - ', '__c')).toBe('My_Object__c');
    });

    test('truncates strings exceeding 40 characters including suffix', () => {
        const longName = 'ThisIsAVeryLongObjectNameThatExceedsTheLimit';
        const expected = longName.substring(0, 40 - 3) + '__c';
        expect(generateApiName(longName, '__c')).toBe(expected);
        expect(generateApiName(longName, '__c').length).toBe(40);

        const longNameNoSuffix = 'ThisIsAVeryLongObjectNameThatExceedsTheLimit';
        const expectedNoSuffix = longNameNoSuffix.substring(0, 40);
        expect(generateApiName(longNameNoSuffix, '')).toBe(expectedNoSuffix);
        expect(generateApiName(longNameNoSuffix, '').length).toBe(40);
    });

    test('removes trailing underscore when truncation cuts on an underscore', () => {
        // "A_Very_Long_Name_With_Underscores_That_Will_Be_Cut"
        // Target length with '__c' is 37.
        // Let's create a string where the 37th character is an underscore.
        // Length 37: 1234567890123456789012345678901234567 (37 chars)
        // If we make char 37 (index 36) an underscore, it should be removed.
        const name = 'ThisIsALongObjectNameThatHasAn_Underscore';
        // 'ThisIsALongObjectNameThatHasAn_'.length is 31
        const paddedName = 'A'.repeat(36) + '_Extra';
        // The truncated version should be 36 characters long, plus suffix
        // 'A'.repeat(36) + '__c'
        const result = generateApiName(paddedName, '__c');
        expect(result).toBe('A'.repeat(36) + '__c');
        expect(result.length).toBe(39); // 36 + 3
    });
});
