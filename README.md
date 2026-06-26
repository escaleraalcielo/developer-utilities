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

### 8. SHA256 Hash
Compute SHA-256 digests of text or files entirely in the browser.
* **Output formats**: lowercase Hex, uppercase HEX, or Base64.
* **File hashing**: drag-and-drop up to 5MB to get a checksum.
* **Verify**: paste a known hash + text to confirm a match (the practical alternative to "decoding", since SHA-256 is one-way and cannot be reversed).

### 9. HMAC-SHA256
Keyed-hash message authentication code using a shared secret.
* **Sign text or files** with a shared secret key (UTF-8 or Hex encoded).
* **Output formats**: lowercase Hex, uppercase HEX, or Base64.
* **Verify**: paste a known signature + message + secret to confirm a match. Comparison uses constant-time equality to avoid timing leaks.
* **Use cases**: webhook signing (Stripe, GitHub, Slack), Salesforce Connected App JWT, signed outbound messages.

### 10. JSON Formatter / Validator / Minifier
Pretty-print, validate, or strip JSON down to its essentials.
* **Format** with 2-space, 4-space, or tab indent.
* **Minify** to a single line for transport / storage.
* **Validate** without transforming — errors include the offending line and column.
* **Strictly offline**: no JSON leaves your browser.

### 11. Hash Identifier
Identify an unknown hash string by format and length.
* Detects **MD5 / SHA family / RIPEMD / Tiger / Whirlpool** in Hex or Base64.
* Detects **password hash formats**: bcrypt, Argon2 (i/d/id), scrypt, PBKDF2 (passlib), md5crypt, sha256crypt, sha512crypt, phpass, Yescrypt, MySQL (3.x and 4.x).
* Detects **JWT** by its three-segment base64url structure.
* Each candidate is rated **high / medium / low** confidence with a one-line explanation.

### 12. SObject ID Decoder
Decode a Salesforce record ID to its SObject type.
* Supports **15-char (case-sensitive)** and **18-char (case-safe)** IDs.
* **60+ standard SF prefixes** mapped to their default SObject (Account, Contact, Opportunity, Case, Lead, User, custom objects, etc.).
* **Bulk decode**: paste many IDs (newline / comma / space separated) and get a table view.
* Custom object prefixes (starting with `a` or `e`) are flagged as "Custom SObject" since the actual name is per-org.

### 13. SOQL Formatter / Validator
Pretty-print Salesforce SOQL queries for readability.
* **Uppercases keywords** (SELECT, FROM, WHERE, AND, OR, INCLUDES, …) while preserving field names and string literals.
* **Line breaks before major clauses** (FROM, WHERE, ORDER BY, GROUP BY, HAVING, LIMIT, …).
* **Subquery-aware** — subquery SELECT lists get extra indent.
* **TYPEOF / WHEN / THEN / ELSE / END** supported for polymorphic SOQL.
* **Validates** SELECT/FROM presence, balanced parens, balanced single quotes (with `''` escape).
* **No SF connection required** — pure string transformation.

### 14. Salesforce Date / DateTime Converter
Convert between formats and timezones for SF datetime values.
* **Parses** ISO 8601, Salesforce DateTime literals (`YYYY-MM-DD HH:MM:SS`), date-only, and Unix epoch (seconds or milliseconds).
* **Outputs** Salesforce Date, SF DateTime UTC, ISO 8601, Unix ms, Unix seconds, and localized string — all in your selected target timezone.
* **TZ-aware**: pick from 20+ IANA timezones (or auto-detect local). Handles DST correctly via `Intl.DateTimeFormat`.
* **Bulk mode**: paste a column of timestamps (one per line), get a formatted table.

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