document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputEl = document.getElementById('inputData');
    const outputEl = document.getElementById('outputData');
    const optionSoqlEl = document.getElementById('optionSoql');
    const inputStatsEl = document.getElementById('inputStats');
    const outputStatsEl = document.getElementById('outputStats');
    const validationMessageEl = document.getElementById('validationMessage');
    const validationTextEl = document.getElementById('validationText');
    const copyBtn = document.getElementById('copyBtn');

    // Event Listeners
    inputEl.addEventListener('input', updateConversion);
    optionSoqlEl.addEventListener('change', updateConversion);

    // --- Core Logic ---

    // Lookup table for the 5-bit checksum character
    const CHECKSUM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

    function convert15to18(id15) {
        if (!id15) return "";
        id15 = id15.trim();

        // Return as-is if already 18 (or not 15) - validation handles the "not 15" warning
        if (id15.length === 18) return id15;
        if (id15.length !== 15) return id15; // Pass through invalid length for now, flagged elsewhere

        let suffix = "";

        // Process in 3 chunks of 5
        for (let i = 0; i < 3; i++) {
            let flags = 0;

            // Loop through the 5 chars in this chunk
            for (let j = 0; j < 5; j++) {
                const char = id15.charAt(i * 5 + j);

                // If uppercase, set the bit
                // Logic: bit 0 corresponds to the character at position 5 (or 0 in specific reversal logic)
                // Standard Algo:
                // For chunk 0 (chars 0-4): Char 0 -> bit 0, Char 1 -> bit 1...
                // Only A-Z are checked.
                if (char >= 'A' && char <= 'Z') {
                    flags += (1 << j);
                }
            }

            suffix += CHECKSUM_CHARS.charAt(flags);
        }

        return id15 + suffix;
    }

    function updateConversion() {
        const rawInput = inputEl.value;
        const lines = rawInput.split(/\r?\n/);

        let validIds = 0;
        let invalidIds = 0;
        let processedIds = [];

        inputStatsEl.textContent = `${lines.length} lines`;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return; // Skip empty lines

            // Validate
            if (trimmed.length === 15 || trimmed.length === 18) {
                const converted = convert15to18(trimmed);
                processedIds.push(converted);
                validIds++;
            } else {
                // Invalid ID length
                processedIds.push(trimmed + " [INVALID]");
                invalidIds++;
            }
        });

        // Toggle Output
        let result = "";
        const isSoql = optionSoqlEl.checked;

        if (isSoql) {
            // Filter out invalids for clean query? Or keep them?
            // Usually for SOQL you want only valid strings
            // Let's keep them but formatted strings
            const formatted = processedIds.map(id => {
                if (id.includes("[INVALID]")) return id; // Don't quote invalids
                return `'${id}'`;
            });
            result = formatted.join(', ');
        } else {
            result = processedIds.join('\n');
        }

        outputEl.value = result;
        outputStatsEl.textContent = `${validIds} valid, ${invalidIds} invalid`;

        // Validation UI
        if (invalidIds > 0) {
            validationMessageEl.classList.remove('d-none');
            validationTextEl.textContent = `${invalidIds} invalid ID(s) detected.`;
            inputEl.classList.add('border-warning');
        } else {
            validationMessageEl.classList.add('d-none');
            inputEl.classList.remove('border-warning');
        }
    }

    // --- Copy Logic ---
    copyBtn.addEventListener('click', () => {
        if (!outputEl.value) return;

        outputEl.select();
        navigator.clipboard.writeText(outputEl.value).then(() => {
            const toastEl = document.getElementById('copyToast');
            if (toastEl && typeof bootstrap !== 'undefined') {
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            }
        });
    });

});
