/**
 * Centralized Sample Data for Dev Utils tools
 */
const SampleData = {
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

    formulaFormatter: `IF(ISPICKVAL(StageName, 'Closed Won'), Amount * 0.1, IF(ISPICKVAL(StageName, 'Negotiation'), Amount * 0.05, 0))`
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SampleData;
}
