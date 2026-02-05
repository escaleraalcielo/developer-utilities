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

### 4. GUID Generator
Generate random Version 4 UUIDs with bulk generation (up to 20) and session history.

## Usage
Run the tools directly from your file system—no web server required.
1. Download or clone the repository.
2. Open `index.html` in any modern web browser.

## Privacy
**Privacy is a feature.** These tools use client-side JavaScript for all operations. 
* No Analytics. 
* No Cookies. 
* No Server-side logging.