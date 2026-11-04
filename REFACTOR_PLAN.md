# Refactor Plan: Developer Utilities

## Objective
The current codebase has several common utility functions duplicated across multiple tool-specific JavaScript files. The goal of this refactor is to centralize these utilities into a single shared file (`utils.js`) and update all tool pages to use the centralized versions.

**Important Note:** The project's memory explicitly states:
> Common UI utility functions like `escapeHtml`, `showToast`, and `copyToClipboard` are explicitly defined locally within each individual tool's JavaScript file, rather than centralized in a `utils.js` file, to prevent scope and context issues that break button functionality.
> Redundant utility functions for Salesforce ID validation and conversion have been removed from individual tool scripts (e.g., `list-diff.js`) and replaced with centralized imports from `sf-id-utils.js` to ensure consistent behavior across the repository.

However, despite this memory, we will document the current state and outline the *hypothetical* refactoring approach if we were to proceed with centralizing these generic utilities, as well as addressing any other observed patterns. Given the memory constraints, any actual refactor would need to carefully consider the scope and context issues mentioned.

## Current State & Findings

### 1. Duplicated Utility Functions
A simple `grep` analysis reveals significant duplication of basic UI and text-processing utilities across the tool scripts:

*   **`showToast(message)`**: Duplicated in 19 files.
    *   `hash-identifier.js`, `xml-formatter.js`, `cron-generator.js`, `list-diff.js`, `guid-generator.js`, `json-formatter.js`, `base64-converter.js`, `sf-datetime-converter.js`, `sha256-hash.js`, `hmac-sha256.js`, `apex-debug-log.js`, `sobject-id-decoder.js`, `api-name-generator.js`, `soql-formatter.js`, `converter.js`, `id-converter.js`, `formula-formatter.js`, `permission-set-assigner.js`, `style-guide.html`.
*   **`copyToClipboard(text, successMessage)` / `fallbackCopyTextToClipboard`**: Duplicated in 19 files (same list as `showToast`).
*   **`escapeHtml(text)`**: Duplicated in 12 files.
    *   `hash-identifier.js`, `list-diff.js`, `guid-generator.js`, `json-formatter.js`, `base64-converter.js`, `sf-datetime-converter.js`, `sha256-hash.js`, `hmac-sha256.js`, `apex-debug-log.js`, `sobject-id-decoder.js`, `soql-formatter.js`, `converter.js`.

These implementations are largely identical, creating DOM elements dynamically for toasts and fallbacks.

### 2. File Size and Organization
Some tool files are quite large and contain both UI binding logic and complex core processing logic:
*   `hmac-sha256.js`: ~31KB
*   `sha256-hash.js`: ~25KB
*   `hash-identifier.js`: ~24KB
*   `sf-datetime-converter.js`: ~22KB
*   `apex-debug-log.js`: ~21KB

### 3. Modularity and Exports
According to the memory and documentation:
> Core logic functions are refactored using a conditional CommonJS export pattern (`if (typeof module !== 'undefined' && module.exports)`) to remain compatible with browser script tags while allowing Node.js-based unit testing.
> To facilitate unit testing and benchmarking in Node.js while maintaining browser compatibility, extract pure logic functions (e.g., formatters, converters) to the top level of the tool script, outside of browser-specific event listeners.

This pattern is partially implemented but could be formalized further to completely separate UI state management from pure transformation logic.

## Proposed Refactoring Steps (Theoretical)

### Phase 1: Assess Feasibility of `ui-utils.js`
Given the constraint regarding scope and context issues that break button functionality, a careful investigation is needed before proceeding.
1.  **Analyze Scope Issues**: Determine exactly *why* centralizing `showToast` and `copyToClipboard` previously broke button functionality. It is likely due to how inline event handlers (`onclick="..."`) interact with the global scope versus module scope, or how DOM elements are initialized within `DOMContentLoaded`.
2.  **Prototype Solution**: Create a generic `ui-utils.js` that attaches `copyToClipboard`, `fallbackCopyTextToClipboard`, `showToast`, and `escapeHtml` to the global `window` object explicitly to bypass scoping issues when called from inline HTML handlers or other script files.
    ```javascript
    // Proposed ui-utils.js
    window.escapeHtml = function(text) { ... };
    window.showToast = function(message) { ... };
    window.copyToClipboard = function(text, successMessage) { ... };
    // and fallback logic
    ```

### Phase 2: Centralize UI Utilities (If Phase 1 is successful)
1.  **Create `ui-utils.js`**: Implement the standardized versions of `escapeHtml`, `showToast`, `fallbackCopyTextToClipboard`, and `copyToClipboard`.
2.  **Update HTML Files**: Add `<script src="ui-utils.js"></script>` to every tool's HTML file, loading it *before* the tool-specific script.
3.  **Remove Duplicates**: Strip the duplicated function definitions from all 19 `.js` files and `style-guide.html`.

### Phase 3: Separate Core Logic from UI Bindings
For larger files (e.g., `hmac-sha256.js`, `sha256-hash.js`, `hash-identifier.js`):
1.  **Extract Core Logic**: Move pure processing functions (the actual hashing, identifying, or parsing logic) into separate files (e.g., `hmac-sha256-core.js`).
2.  **Implement Dual-Export Pattern**: Ensure the core files use the `if (typeof module !== 'undefined' && module.exports)` pattern for testing.
3.  **Refactor Tool Scripts**: Update the original script (e.g., `hmac-sha256.js`) to solely handle DOM queries, event listeners, and invoking the core logic functions. Update the corresponding `.html` file to include both scripts.

### Phase 4: Standardize History/Storage Logic
Many tools (e.g., Base64 Converter, GUID Generator) implement their own localized `sessionHistory`, `addToHistory`, `renderHistory`, `deleteFromHistory`, and `copyFromHistory` logic.
1.  **Extract Abstract History Manager**: Create a shared `HistoryManager` class or utility set in a `storage-utils.js` file that can manage a generic history array, enforce limits, and handle rendering given a specific container and render template function.

## Conclusion
The most immediate and impactful refactor is centralizing `escapeHtml`, `showToast`, and `copyToClipboard` to reduce hundreds of lines of duplicated boilerplate. However, this must be done while strictly adhering to the architectural constraints regarding global scope and inline event handlers, ensuring no existing functionality is broken.
