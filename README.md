# Dev Utils

## Overview
**Dev Utils** is a suite of secure, offline-first developer utilities designed to run entirely in your browser. All data processing occurs locally on your machine—no data is ever sent to an external server.

## Features

### 1. Column to List Converter
Transform spreadsheet columns into formatted lists for code or queries.
* **Delimiters**: Comma, semicolon, pipe, space, or custom strings.
* **Formatting**: Optional single/double quotes and enclosure (brackets, parentheses).
* **Clean-up**: Deduplication, alphabetical sorting, and whitespace trimming.

### 2. Salesforce ID Utilities
* **15-to-18 Converter**: Convert Case-Sensitive IDs to Case-Safe versions.
* **SOQL Formatter**: Instantly wrap IDs in single quotes and commas for `IN` clauses.
* **List Difference**: Compare two lists of IDs; the "Smart SF Mode" normalizes 15 and 18 character IDs to ensure accurate comparisons.

### 3. Permission Set CSV Generator
Bulk-generate CSV files for Salesforce Permission Set or License assignments.
* **Cross-Join Logic**: Assign multiple Permission Sets to multiple Users in one click.
* **Clean Mode**: Automatically extracts valid Salesforce IDs from messy text.

### 4. Base64 Converter
*   **File to Base64**: Drag and drop any file to convert it to a Base64 string.
*   **Text Mode**:
    *   **Encode**: Convert text to Base64 (with Lock icon).
    *   **Decode**: Convert Base64 strings back to text (with Unlock icon).
    *   **Validation**: Strict 5000-character input limit with visual alerts for performance safety.
*   **History**: Tracks the last 10 conversions locally for quick reference.
*   **Mobile Friendly**: Full-width segmented controls and responsive design.
*   **Safety**: All processing is client-side. The tool is sandboxed in the browser and does not execute decoded scripts.

### 5. GUID Generator
Generate random Version 4 UUIDs with bulk generation (up to 20) and session history.

### 6. Apex Debug Log Filter
Filter massive raw Salesforce debug logs.
* Extracts useful context like `USER_DEBUG`, `EXCEPTION`, `METHOD_ENTRY/EXIT`.
* Includes custom keyword search over the log output.

### 7. XML / package.xml Formatter
Format and minify XML documents.
* Auto-indent options (2 spaces, 4 spaces, or tab).
* One-click formatting for metadata config and `package.xml` files.

## Usage
Run the tools directly from your file system—no web server required.
1. Download or clone the repository.
2. Open `index.html` in any modern web browser.

## 🔒 Security & Privacy
*   **Local Processing**: All tools operate 100% client-side. No data is ever sent to a server.
*   **Safe Execution**: Decoded outputs are displayed as plain text and are not executed by the browser.
*   **Performance**: Input limits prevent the browser from freezing due to excessive data.
*   **No Analytics**: No tracking of usage.
*   **No Cookies**: No data stored in cookies.
*   **No Server-side logging**: No server-side logs are generated as there is no server.

## 🤝 Contributing
1.  Clone the repository (or copy the files).
2.  Open `index.html` in your browser.
3.  Feel free to customize the `style.css` variables to match your brand.