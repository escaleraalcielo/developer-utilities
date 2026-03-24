document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputLabels = document.getElementById('inputLabels');
    const outputNames = document.getElementById('outputNames');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const suffixSelect = document.getElementById('suffixSelect');
    const inputCount = document.getElementById('inputCount');
    const outputCount = document.getElementById('outputCount');

    // Real-time counting
    inputLabels.addEventListener('input', () => {
        const text = inputLabels.value.trim();
        const count = text ? text.split('\n').filter(line => line.trim().length > 0).length : 0;
        inputCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    });

    // Generate API Names
    generateBtn.addEventListener('click', () => {
        const text = inputLabels.value;
        if (!text.trim()) return;

        const suffix = suffixSelect.value;
        const labels = text.split('\n');
        const apiNames = labels.map(label => {
            const trimmed = label.trim();
            if (!trimmed) return '';
            return generateApiName(trimmed, suffix);
        });

        outputNames.value = apiNames.join('\n');

        const count = apiNames.filter(name => name.length > 0).length;
        outputCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;

        copyBtn.disabled = count === 0;
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        if (!outputNames.value) return;
        outputNames.select();
        window.copyToClipboard(outputNames.value, 'API names copied!');
    });

    // Clear Logic
    clearBtn.addEventListener('click', () => {
        inputLabels.value = '';
        outputNames.value = '';
        inputCount.textContent = '0 items';
        outputCount.textContent = '0 items';
        copyBtn.disabled = true;
    });

    // Core Salesforce API Name Generation Logic
    function generateApiName(label, suffix) {
        // 1. Convert to Title Case for better readability (optional but standard practice)
        // or just keep original casing and only replace invalid chars.
        // We'll preserve case but replace invalid chars with underscores.

        // Replace accented characters with basic Latin equivalents
        let name = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // 2. Replace any non-alphanumeric character (spaces, symbols, hyphens) with underscore
        name = name.replace(/[^a-zA-Z0-9]/g, '_');

        // 3. Remove consecutive underscores
        name = name.replace(/_+/g, '_');

        // 4. Ensure it doesn't start with a number or underscore
        if (/^[0-9_]/.test(name)) {
            name = name.replace(/^_+/, ''); // Remove leading underscores
            if (/^[0-9]/.test(name)) {
                name = 'X' + name; // Prefix with X if it starts with a number
            }
        }

        // 5. Ensure it doesn't end with an underscore
        name = name.replace(/_+$/, '');

        // 6. Max length limit in Salesforce is 40 characters for Custom Fields/Objects (including suffix)
        // Adjusting max length to 40 - suffix.length
        const maxLength = 40 - suffix.length;
        if (name.length > maxLength) {
            name = name.substring(0, maxLength);
            // Re-trim ending underscore if substring cut it on an underscore
            name = name.replace(/_+$/, '');
        }

        return name + suffix;
    }
});

// For testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateApiName: function(label, suffix) {
        // We need to re-implement it here to expose it since it's nested
        let name = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        name = name.replace(/[^a-zA-Z0-9]/g, '_');
        name = name.replace(/_+/g, '_');
        if (/^[0-9_]/.test(name)) {
            name = name.replace(/^_+/, '');
            if (/^[0-9]/.test(name)) {
                name = 'X' + name;
            }
        }
        name = name.replace(/_+$/, '');
        const maxLength = 40 - suffix.length;
        if (name.length > maxLength) {
            name = name.substring(0, maxLength);
            name = name.replace(/_+$/, '');
        }
        return name + suffix;
    }};
}
