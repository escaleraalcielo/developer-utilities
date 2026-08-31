# End-to-End (E2E) Test Plan for Dev Utils

## 1. Introduction
This document outlines the End-to-End (E2E) Test Plan for the Dev Utils application. Dev Utils is a suite of secure, offline-first developer utilities designed to run entirely in the browser.

## 2. Environment and Tools
* **Testing Framework**: Playwright (recommended) or Cypress.
* **Browsers**: Chromium (Chrome/Edge), Firefox, WebKit (Safari).
* **Test Environment**: Local static file server or directly opening `index.html` via `file://` protocol.
* **Network Constraints**: Tests must be executed with and without network connectivity to verify the offline-first nature of the utilities.

## 3. Scope of Testing
The E2E tests will cover:
* Core functionality of all individual tools.
* Navigation from the main `index.html` dashboard to each tool and back.
* File upload and drag-and-drop interactions.
* Copy to clipboard functionality (requires appropriate browser permissions in the test environment).
* Dark mode and UI responsiveness.
* Client-side validation and error handling.
* Performance under large input limits (e.g., 5000 character limits, large file handling).

## 4. Test Strategy
* **Setup**: Launch the browser, navigate to the local `index.html`.
* **Execution**: For each test, simulate user interaction, provide input (text or files), trigger the processing, and assert the output matches expected results.
* **Teardown**: Clear any browser storage (like localStorage used by Base64 converter history) if needed between tests to ensure a clean state.

## 5. Test Scenarios

### 5.1. General Navigation & UI
* **TC_NAV_01**: Verify that `index.html` loads successfully and displays all tool cards.
* **TC_NAV_02**: Verify that clicking each tool card navigates to the correct tool page.
* **TC_NAV_03**: Verify the back button or home icon navigates back to `index.html`.
* **TC_UI_01**: Verify dark mode styling is applied.

### 5.2. Column to List Converter
* **TC_COL_01**: Input a column of text, select comma delimiter, and verify correct list output.
* **TC_COL_02**: Test single and double quotes enclosure options.
* **TC_COL_03**: Test deduplication, sorting, and whitespace trimming options.

### 5.3. Salesforce ID Utilities
* **TC_ID_01**: Convert a valid 15-character ID to an 18-character Case-Safe ID.
* **TC_ID_02**: Test SOQL Formatter by inputting a list of IDs and ensuring they are wrapped in single quotes and separated by commas.
* **TC_ID_03**: Compare two lists of IDs in List Diff tool and verify correct intersection and differences are shown.

### 5.4. Permission Set CSV Generator
* **TC_PERM_01**: Input a list of User IDs and Permission Set IDs, generate CSV, and verify cross-join output format.
* **TC_PERM_02**: Test "Clean Mode" by providing messy text containing valid IDs and verify correct extraction.

### 5.5. Base64 Converter
* **TC_B64_01**: Input text, encode to Base64, and verify output.
* **TC_B64_02**: Input valid Base64 string, decode to text, and verify output.
* **TC_B64_03**: Test file drag-and-drop/upload for Base64 conversion.
* **TC_B64_04**: Verify 5000-character input limit validation and visual alerts.
* **TC_B64_05**: Verify that local history accurately records the last 10 conversions.

### 5.6. GUID Generator
* **TC_GUID_01**: Generate a single version 4 UUID and verify format.
* **TC_GUID_02**: Generate bulk UUIDs (e.g., 20) and verify the count and formats.
* **TC_GUID_03**: Verify session history is maintained.

### 5.7. Apex Debug Log Filter
* **TC_LOG_01**: Input a raw debug log and filter by `USER_DEBUG` and `EXCEPTION`.
* **TC_LOG_02**: Test custom keyword search functionality over the log.

### 5.8. XML / package.xml Formatter
* **TC_XML_01**: Input unformatted XML, apply 2-space indent format, and verify the structured output.
* **TC_XML_02**: Test minification of XML into a single line.

### 5.9. SHA256 Hash
* **TC_SHA_01**: Input text and generate SHA-256 hash in Hex, uppercase HEX, and Base64.
* **TC_SHA_02**: Upload a file (under 5MB) and generate hash.
* **TC_SHA_03**: Test Verify feature by pasting a known hash and text.

### 5.10. HMAC-SHA256
* **TC_HMAC_01**: Input message and secret, generate HMAC in Hex, uppercase HEX, and Base64.
* **TC_HMAC_02**: Test Verify feature with known signature, message, and secret.

### 5.11. JSON Formatter
* **TC_JSON_01**: Input valid unformatted JSON, pretty-print, and verify.
* **TC_JSON_02**: Input invalid JSON and verify validation error displays line/column details.
* **TC_JSON_03**: Minify JSON and verify single-line output.

### 5.12. Hash Identifier
* **TC_HID_01**: Input various hash formats (MD5, SHA-256, bcrypt, JWT) and verify correct identification and confidence rating.

### 5.13. SObject ID Decoder
* **TC_SOBJ_01**: Input valid 15-char and 18-char standard object IDs and verify correct SObject type (e.g., Account, Contact).
* **TC_SOBJ_02**: Input a custom object ID and verify it is flagged as "Custom SObject".
* **TC_SOBJ_03**: Test bulk decode with newline/comma/space separated IDs.

### 5.14. SOQL Formatter
* **TC_SOQL_01**: Input a raw SOQL query and verify it upper-cases keywords and adds proper line breaks.
* **TC_SOQL_02**: Test invalid SOQL (e.g., unbalanced parenthesis) and verify validation error.

### 5.15. Salesforce Date / DateTime Converter
* **TC_DATE_01**: Input SF DateTime literal, convert to ISO 8601 in a specific timezone, and verify output.
* **TC_DATE_02**: Test bulk mode conversion with a column of timestamps.

### 5.16. Additional Tools
* **TC_ADD_01**: (API Name Generator) Input text and verify correct API name constraints (max 40 chars, underscores replaced, suffix appended).
* **TC_ADD_02**: (Cron Generator) Input schedules and verify valid cron expression generation.
* **TC_ADD_03**: (Formula Formatter) Input unformatted Salesforce formula and verify pretty-print structure.

## 6. Execution and Reporting
* Tests should be run as part of the CI/CD pipeline or manually using a local test runner.
* Test failures must capture screenshots and trace logs for debugging.
* Generate an HTML report detailing the pass/fail status of all scenarios.
