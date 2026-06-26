/**
 * Centralized Sample Data for Dev Utils tools
 */
window.SampleData = {
    columnConverter: `Acme Corporation
Global Industries
Stark Enterprises
Wayne Enterprises
Acme Corporation
Wonka Industries
Oscorp
Stark Enterprises`,

    idConverter: `0015500000Wv25U
0015500000Wv25V
0015500000Wv25W
0015500000Wv25X
InvalidIDHere
0015500000Wv25Y`,

    listDiff: {
        listA: `0015500000Wv25U
0015500000Wv25V
0015500000Wv25WAAR
0015500000Wv25X
Non-SF-ID-A
DuplicateA
DuplicateA`,
        listB: `0015500000Wv25UAAR
0015500000Wv25V
0015500000Wv25W
0015500000Wv25Y
Non-SF-ID-B
DuplicateB
DuplicateB`
    },

    permissionSetAssigner: {
        users: `0055f0000053QLvAAM\n0055f0000053QLwAAM\n0055f0000053QLxAAM`,
        permSets: `0PS5f000003biIsGAI\n0PS5f000003biItGAI`
    },

    base64Converter: `This is a sample string demonstrating Base64 encoding.
It can handle multiple lines and symbols! @#$%^&*()`,

    apexDebugLog: `59.0 APEX_CODE,DEBUG;APEX_PROFILING,INFO
09:15:30.000 (0) EXECUTION_STARTED
09:15:30.000 (1000) CODE_UNIT_STARTED|[EXTERNAL]|MyApexClass
09:15:30.000 (2000) METHOD_ENTRY|[1]|MyApexClass.doWork()
09:15:30.000 (3000) USER_DEBUG|[10]|DEBUG|Starting work process...
09:15:30.000 (4000) SOQL_EXECUTE_BEGIN|[15]|Aggregations:0|SELECT Id FROM Account LIMIT 1
09:15:30.000 (5000) USER_DEBUG|[16]|DEBUG|Account found.
09:15:30.000 (6000) EXCEPTION_THROWN|[20]|System.NullPointerException: Attempt to de-reference a null object
09:15:30.000 (7000) FATAL_ERROR|System.NullPointerException: Attempt to de-reference a null object
09:15:30.000 (8000) METHOD_EXIT|[1]|MyApexClass.doWork()
09:15:30.000 (9000) CODE_UNIT_FINISHED|MyApexClass
09:15:30.000 (10000) EXECUTION_FINISHED`,

    xmlFormatter: `<?xml version="1.0" encoding="UTF-8"?><Package xmlns="http://soap.sforce.com/2006/04/metadata"><types><members>Account</members><members>Contact</members><name>CustomObject</name></types><types><members>MyApexClass</members><name>ApexClass</name></types><version>59.0</version></Package>`,

    apiNameGenerator: `First Name\nLast Name\nAnnual Revenue (%)\nIs Active?\n123 Street Address\nA very long field name that exceeds the forty character limit by quite a lot`,

    formulaFormatter: `IF(ISPICKVAL(StageName, 'Closed Won'), Amount * 0.1, IF(ISPICKVAL(StageName, 'Negotiation'), Amount * 0.05, 0))`,

    sha256Hash: `Hash me with SHA-256 and try the Verify tab against the same text.`,

    sha256Verify: {
        // SHA-256 of "Hello, SHA-256!" -> computed reference
        text: 'Hello, SHA-256!',
        expectedHash: 'd0e8b8f11c98f369016eb2ed3c541e1f01382f9d5b3104c9ffd06b6175a46271'
    },

    hmacSha256: {
        key: 'whsec_dev_utils_demo_secret_2026',
        message: '{"event":"order.created","id":12345,"amount":9900}'
    },

    hmacSha256Verify: {
        // HMAC-SHA256 of the message above with the key above (computed locally for the sample).
        expectedSignature: 'caa236a51aa64bd3f99aa9170e4799f67e516f635059de12c9ebaf8d7819aaf9'
    },

    jsonFormatter: '{"name":"Dev Utils","version":"1.0.0","active":true,"tags":["offline","secure","browser-only"],"features":[{"id":1,"name":"Base64","category":"encoding"},{"id":2,"name":"SHA-256","category":"hashing"},{"id":3,"name":"HMAC-SHA256","category":"signing"}],"settings":{"theme":"dark","limits":{"maxChars":5000,"maxFileMB":5},"experimental":null},"releaseDate":"2026-06-26T09:00:00.000Z"}',

    jsonFormatterBroken: '{"name":"Acme","active":true,"tags":["a","b",]}',

    hashIdentifier: {
        sha256: 'd0e8b8f11c98f369016eb2ed3c541e1f01382f9d5b3104c9ffd06b6175a46271',
        sha1: 'a9993e364706816aba3e25717850c26c9cd0d89d',
        md5: '5d41402abc4b2a76b9719d911017c592',
        bcrypt: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    },

    sobjectIdDecoder: {
        standard: '0015500000Wv25U',
        caseSafe: '0035500000Wv25UAAR',
        custom: 'a015500000Wv25U'
    },

    soqlFormatter: "SELECT Id, Name, Account.Name, Account.Industry, (SELECT Id, Subject FROM Cases WHERE IsClosed = false) FROM Contact WHERE Account.Industry != null AND CreatedDate > 2024-01-01T00:00:00Z AND (Status = 'Active' OR Status = 'Pending') ORDER BY Name LIMIT 100",

    sfDatetimeConverter: {
        single: '2024-01-15T10:30:00Z',
        bulk: [
            '2024-01-15T10:30:00Z',
            '2024-02-20T15:45:00+06:00',
            '2024-03-01',
            '2024-04-10 09:00:00',
            '1705314600'
        ]
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.SampleData;
}
