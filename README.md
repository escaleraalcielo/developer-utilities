# Dev Utils

## Overview
**Dev Utils** is a suite of secure, offline-first developer utilities designed to run locally on your machine. No data leaves your browser, ensuring your sensitive information remains private.

## Features

### 1. Column to List Converter
A powerful tool to transform column data (e.g., from spreadsheets) into formatted lists.
*   **Delimiters**: Comma, semicolon, pipe, space, new line, or custom.
*   **Formatting**: Wrap items in single quotes, double quotes, or brackets/parentheses.
*   **Options**:
    *   Trim whitespace
    *   Remove duplicates
    *   Sort alphabetically
    *   Ignore empty lines
*   **Session History**: Keep track of your recent conversions.

### 2. GUID Generator
Quickly generate random UUIDs (version 4).
*   **Bulk Generation**: Create up to 20 GUIDs at once.
*   **Convenience**: One-click copy to clipboard.
*   **History**: View previously generated GUIDs in the current session.

### 3. Salesforce ID Converter
Convert 15-character Salesforce IDs to 18-character case-insensitive IDs.
*   **Bulk Conversion**: Paste columns of IDs.
*   **SOQL Ready**: Toggle to format IDs for SQL/SOQL queries (e.g., `'ID1', 'ID2'`).
*   **Validation**: Detects and flags invalid ID lengths.

## Usage
Since this is a client-side only application, you can run it directly from your file system.

1.  Clone the repository or download the source files.
2.  Open `index.html` in your web browser.

## Technologies
*   **HTML5**
*   **Vanilla JavaScript**
*   **Bootstrap 5**
*   **Bootstrap Icons**
*   **Google Fonts (Inter)**

## Privacy
This project is built with privacy in mind. All processing happens locally in your browser using JavaScript. No data is sent to any external server.
