document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputFormula = document.getElementById('inputFormula');
    const outputFormula = document.getElementById('outputFormula');
    const formatBtn = document.getElementById('formatBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const indentSelect = document.getElementById('indentSelect');

    // Auto-resize for textarea if needed, but we use flex layout

    formatBtn.addEventListener('click', () => {
        const raw = inputFormula.value;
        if (!raw.trim()) return;

        let indentChar = indentSelect.value;
        if (indentChar === '2') {
            indentChar = '  ';
        } else if (indentChar === '4') {
            indentChar = '    ';
        }

        const formatted = formatSalesforceFormula(raw, indentChar);
        outputFormula.value = formatted;
        copyBtn.disabled = false;
    });

    copyBtn.addEventListener('click', () => {
        if (!outputFormula.value) return;
        outputFormula.select();
        window.copyToClipboard(outputFormula.value, 'Formula copied to clipboard!');
    });

    clearBtn.addEventListener('click', () => {
        inputFormula.value = '';
        outputFormula.value = '';
        copyBtn.disabled = true;
    });

    /**
     * Basic Salesforce Formula Formatter
     * - Breaks on functions
     * - Indents based on parenthesis depth
     * - Respects logical operators
     */
    function formatSalesforceFormula(formula, indentStr) {
        // 1. Remove all existing line breaks and extra spaces
        let clean = formula.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

        let result = '';
        let indentLevel = 0;
        let inQuotes = false;

        // Function to generate indentation
        const getIndent = (level) => indentStr.repeat(Math.max(0, level));

        for (let i = 0; i < clean.length; i++) {
            let char = clean[i];

            // Toggle string literals (single or double quotes)
            if (char === "'" || char === '"') {
                inQuotes = !inQuotes;
                result += char;
                continue;
            }

            if (inQuotes) {
                result += char;
                continue;
            }

            // Handle structure
            if (char === '(') {
                indentLevel++;
                result += '(\n' + getIndent(indentLevel);
                // remove following space if it exists
                if (i + 1 < clean.length && clean[i+1] === ' ') i++;
            } else if (char === ')') {
                indentLevel--;
                result += '\n' + getIndent(indentLevel) + ')';
            } else if (char === ',') {
                result += ',\n' + getIndent(indentLevel);
                if (i + 1 < clean.length && clean[i+1] === ' ') i++;
            } else if (char === ' ') {
                // Formatting specific operators (AND, OR, &&, ||)
                // We'll leave them inline unless they are followed by complex expressions,
                // but for simplicity we keep single space.
                result += char;
            } else {
                result += char;
            }
        }

        // Post-processing to clean up any empty lines or double indents
        return result.replace(/\n\s*\n/g, '\n').trim();
    }
});
