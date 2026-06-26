const { tokenizeSoql, validateSoql, formatSoql, emitFormatted } = require('./soql-formatter');

describe('tokenizeSoql', () => {
    test('basic select-from-where', () => {
        const tokens = tokenizeSoql('SELECT Id FROM Contact');
        expect(tokens.map(t => t.value)).toEqual(['SELECT', 'Id', 'FROM', 'Contact']);
    });

    test('handles string literals with single quotes', () => {
        const tokens = tokenizeSoql("SELECT Id FROM Contact WHERE Name = 'Acme''s Corp'");
        expect(tokens.find(t => t.type === 'string').value).toBe("'Acme''s Corp'");
    });

    test('operators are separate tokens', () => {
        const tokens = tokenizeSoql("SELECT Id FROM Account WHERE AnnualRevenue != null AND CreatedDate > 2023-01-01");
        const ops = tokens.filter(t => t.type === 'op').map(t => t.value);
        expect(ops).toContain('!=');
        expect(ops).toContain('>');
    });

    test('multi-word keyword lookahead (ORDER BY)', () => {
        const tokens = tokenizeSoql('SELECT Id FROM Contact ORDER BY Name');
        const orderBy = tokens.find(t => t.value === 'ORDER BY');
        expect(orderBy).toBeDefined();
    });

    test('multi-word keyword (GROUP BY)', () => {
        const tokens = tokenizeSoql('SELECT Type FROM Account GROUP BY Type');
        const gb = tokens.find(t => t.value === 'GROUP BY');
        expect(gb).toBeDefined();
    });

    test('multi-word keyword (FOR UPDATE)', () => {
        const tokens = tokenizeSoql('SELECT Id FROM Account FOR UPDATE');
        expect(tokens.find(t => t.value === 'FOR UPDATE')).toBeDefined();
    });

    test('subquery parens detected', () => {
        const tokens = tokenizeSoql('SELECT Id FROM Account WHERE Id IN (SELECT AccountId FROM Contact)');
        const parens = tokens.filter(t => t.type === 'punct' && t.value === '(');
        expect(parens.length).toBe(1);
    });
});

describe('validateSoql', () => {
    test('valid simple query', () => {
        expect(validateSoql('SELECT Id FROM Contact').ok).toBe(true);
    });

    test('valid query with where/order/limit', () => {
        const r = validateSoql("SELECT Id, Name FROM Contact WHERE Account.Industry = 'Tech' ORDER BY Name LIMIT 10");
        expect(r.ok).toBe(true);
    });

    test('valid subquery', () => {
        const r = validateSoql('SELECT Id FROM Account WHERE Id IN (SELECT AccountId FROM Contact)');
        expect(r.ok).toBe(true);
    });

    test('missing SELECT', () => {
        const r = validateSoql('FROM Contact');
        expect(r.ok).toBe(false);
        expect(r.error).toMatch(/SELECT/);
    });

    test('missing FROM', () => {
        const r = validateSoql('SELECT Id');
        expect(r.ok).toBe(false);
        expect(r.error).toMatch(/FROM/);
    });

    test('unbalanced closing paren', () => {
        const r = validateSoql('SELECT Id FROM Account WHERE Id IN (SELECT AccountId FROM Contact');
        expect(r.ok).toBe(false);
        expect(r.error).toMatch(/[Uu]nbalanced/);
    });

    test('unbalanced extra closing paren', () => {
        const r = validateSoql('SELECT Id FROM Account)');
        expect(r.ok).toBe(false);
        expect(r.error).toMatch(/[Uu]nbalanced/);
    });

    test('unterminated string literal', () => {
        const r = validateSoql("SELECT Id FROM Contact WHERE Name = 'Acme");
        expect(r.ok).toBe(false);
        expect(r.error).toMatch(/string/);
    });

    test('escaped single quote in string is balanced', () => {
        const r = validateSoql("SELECT Id FROM Contact WHERE Name = 'Acme''s Corp'");
        expect(r.ok).toBe(true);
    });

    test('empty query', () => {
        const r = validateSoql('');
        expect(r.ok).toBe(false);
    });

    test('whitespace-only query', () => {
        const r = validateSoql('   \n  ');
        expect(r.ok).toBe(false);
    });
});

describe('formatSoql', () => {
    test('uppercases keywords', () => {
        const r = formatSoql('select id from contact');
        expect(r.ok).toBe(true);
        expect(r.output).toContain('SELECT');
        expect(r.output).toContain('FROM');
    });

    test('preserves case of field names', () => {
        const r = formatSoql('select myField__c, otherField from Account');
        expect(r.output).toContain('myField__c');
        expect(r.output).toContain('otherField');
    });

    test('line break before FROM', () => {
        const r = formatSoql('SELECT Id, Name FROM Contact');
        expect(r.output).toMatch(/SELECT\n\s+Id,\n\s+Name\nFROM Contact/);
    });

    test('line break before WHERE', () => {
        const r = formatSoql("SELECT Id FROM Contact WHERE Name = 'X'");
        expect(r.output).toMatch(/FROM Contact\nWHERE/);
    });

    test('line break before ORDER BY', () => {
        const r = formatSoql("SELECT Id FROM Contact ORDER BY Name");
        expect(r.output).toMatch(/ORDER BY Name/);
    });

    test('line break before LIMIT', () => {
        const r = formatSoql("SELECT Id FROM Contact LIMIT 10");
        expect(r.output).toMatch(/LIMIT 10/);
    });

    test('commas break each field onto its own line', () => {
        const r = formatSoql('SELECT Id, Name, Email FROM Contact');
        const lines = r.output.split('\n');
        // Expect at least 4 lines: SELECT, Id,, Name,, Email, FROM
        expect(lines.length).toBeGreaterThanOrEqual(5);
    });

    test('operators get space-around treatment', () => {
        const r = formatSoql("SELECT Id FROM Contact WHERE AnnualRevenue != null");
        expect(r.output).toMatch(/AnnualRevenue != NULL/);
    });

    test('preserves string literals verbatim', () => {
        const r = formatSoql("SELECT Id FROM Contact WHERE Name = 'Acme''s Corp'");
        expect(r.output).toContain("'Acme''s Corp'");
    });

    test('handles subquery with proper indent', () => {
        const r = formatSoql('SELECT Id FROM Account WHERE Id IN (SELECT AccountId FROM Contact WHERE IsActive = true)');
        expect(r.ok).toBe(true);
        expect(r.output).toContain('FROM Contact');
        // Subquery SELECT and its first field are separated by a newline + extra indent.
        expect(r.output).toMatch(/\(SELECT\n {4,}AccountId/);
    });

    test('returns validation error on bad input', () => {
        const r = formatSoql('FROM Contact');
        expect(r.ok).toBe(false);
        expect(r.error).toMatch(/SELECT/);
    });

    test('2-space indent', () => {
        const r = formatSoql('SELECT Id, Name FROM Contact', '  ');
        expect(r.output).toMatch(/\n {2}Id,/);
    });

    test('4-space indent', () => {
        const r = formatSoql('SELECT Id, Name FROM Contact', '    ');
        expect(r.output).toMatch(/\n {4}Id,/);
    });

    test('tab indent', () => {
        const r = formatSoql('SELECT Id, Name FROM Contact', '\t');
        expect(r.output).toMatch(/\n\tId,/);
    });

    test('collapses excess whitespace within lines', () => {
        const r = formatSoql('SELECT    Id   ,    Name   FROM   Contact');
        // Each line should have at most single spaces between tokens (indentation is fine).
        const lines = r.output.split('\n');
        for (const line of lines) {
            // Strip leading indentation for this check.
            const stripped = line.replace(/^\s+/, '');
            expect(stripped).not.toMatch(/  +/);
        }
    });

    test('handles TYPEOF ... WHEN ... THEN ... END', () => {
        const r = formatSoql("SELECT Id, TYPEOF What WHEN Account THEN Name, Industry WHEN Opportunity THEN Amount ELSE Name END FROM Event");
        expect(r.ok).toBe(true);
        expect(r.output).toContain('TYPEOF');
        expect(r.output).toContain('WHEN');
        expect(r.output).toContain('THEN');
        expect(r.output).toContain('ELSE');
        expect(r.output).toContain('END');
    });

    test('handles INCLUDES / EXCLUDES operators', () => {
        const r = formatSoql("SELECT Id FROM Contact WHERE Hobbies__c INCLUDES ('Reading', 'Gaming')");
        expect(r.ok).toBe(true);
        expect(r.output).toContain('INCLUDES');
    });

    test('full real-world query', () => {
        const q = "SELECT Id, Name, Account.Name, Account.Industry FROM Contact WHERE Account.Industry != null AND CreatedDate > 2023-01-01T00:00:00Z ORDER BY Name LIMIT 100";
        const r = formatSoql(q);
        expect(r.ok).toBe(true);
        expect(r.output).toContain('SELECT');
        expect(r.output).toContain('FROM Contact');
        expect(r.output).toMatch(/WHERE Account\.Industry != NULL/);
        expect(r.output).toContain('AND CreatedDate >');
        expect(r.output).toContain('ORDER BY Name');
        expect(r.output).toContain('LIMIT 100');
    });
});

describe('emitFormatted (edge cases)', () => {
    test('idempotent on already-formatted input', () => {
        const input = "SELECT\n  Id,\n  Name\nFROM Contact\nWHERE Active = TRUE";
        const tokens = tokenizeSoql(input);
        const out = emitFormatted(tokens, '  ');
        expect(out).toBe(input);
    });

    test('handles empty token list', () => {
        expect(emitFormatted([], '  ')).toBe('');
    });
});