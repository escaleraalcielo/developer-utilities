document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputEl = document.getElementById('inputData');
    const outputEl = document.getElementById('outputData');
    const inputStatsEl = document.getElementById('inputStats');
    const outputStatsEl = document.getElementById('outputStats');
    const btnFormat = document.getElementById('btnFormat');
    const btnMinify = document.getElementById('btnMinify');
    const indentSizeEl = document.getElementById('indentSize');
    const copyBtn = document.getElementById('copyBtn');
    const validationMessage = document.getElementById('validationMessage');
    const validationText = document.getElementById('validationText');

    let currentMode = 'format'; // 'format' or 'minify'

    // Event Listeners
    inputEl.addEventListener('input', () => {
        updateStats();
        processXml();
    });

    btnFormat.addEventListener('click', () => {
        currentMode = 'format';
        btnFormat.classList.remove('btn-outline-primary');
        btnFormat.classList.add('btn-primary');
        btnMinify.classList.remove('btn-secondary');
        btnMinify.classList.add('btn-outline-secondary');
        processXml();
    });

    btnMinify.addEventListener('click', () => {
        currentMode = 'minify';
        btnMinify.classList.remove('btn-outline-secondary');
        btnMinify.classList.add('btn-secondary');
        btnFormat.classList.remove('btn-primary');
        btnFormat.classList.add('btn-outline-primary');
        processXml();
    });

    indentSizeEl.addEventListener('change', () => {
        if(currentMode === 'format') processXml();
    });

    // Global func for clear button
    window.updateFormat = () => {
        updateStats();
        processXml();
    };

    function updateStats() {
        const val = inputEl.value;
        inputStatsEl.textContent = `${val.length} characters`;
    }

    function processXml() {
        const rawXml = inputEl.value.trim();

        if (!rawXml) {
            outputEl.value = '';
            outputStatsEl.textContent = '0 characters';
            hideError();
            return;
        }

        try {
            // First check if it's actually parsable XML to catch errors
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(rawXml, "text/xml");

            // Check for parse errors
            const parseError = xmlDoc.getElementsByTagName("parsererror");
            if (parseError.length > 0) {
                throw new Error(parseError[0].textContent);
            }

            // Since it's valid, we can process it
            let result = '';
            if (currentMode === 'format') {
                const indentVal = indentSizeEl.value;
                const indentStr = indentVal === 'tab' ? '\t' : ' '.repeat(parseInt(indentVal, 10));
                // Minify first to normalize existing whitespace and newlines before formatting
                const normalizedXml = minifyXml(rawXml);
                result = formatXml(normalizedXml, indentStr);
            } else {
                result = minifyXml(rawXml);
            }

            outputEl.value = result;
            outputStatsEl.textContent = `${result.length} characters`;
            hideError();

        } catch (e) {
            showError("Invalid XML: " + e.message);
        }
    }

    // Basic regex-based XML formatter
    function formatXml(xml, indent) {
        let formatted = '';
        let pad = 0;

        // Remove existing formatting
        xml = xml.replace(/(>)(<)(\/*)/g, '$1\r\n$2$3');

        const lines = xml.split('\r\n');

        lines.forEach(function(node) {
            let indentStr = 0;
            if (node.match(/.+<\/\w[^>]*>$/)) {
                indentStr = 0;
            } else if (node.match(/^<\/\w/)) {
                if (pad != 0) {
                    pad -= 1;
                }
            } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
                indentStr = 1;
            } else {
                indentStr = 0;
            }

            let padding = '';
            for (let i = 0; i < pad; i++) {
                padding += indent;
            }

            formatted += padding + node + '\r\n';
            pad += indentStr;
        });

        // Trim the extra newline at the end
        return formatted.trim();
    }

    function minifyXml(xml) {
        // Remove spaces between tags, and normalize whitespace
        return xml.replace(/\>[\r\n ]+\</g, "><").replace(/(<[^\/>]+>)\s+(<\/[^>]+>)/g, "$1$2").trim();
    }

    function showError(msg) {
        validationMessage.classList.remove('d-none');
        validationText.textContent = msg;
        inputEl.classList.add('border-danger');
    }

    function hideError() {
        validationMessage.classList.add('d-none');
        inputEl.classList.remove('border-danger');
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