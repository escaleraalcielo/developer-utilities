document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const permSetIdsInput = document.getElementById('permSetIds'); // Changed ID
    const userIdsInput = document.getElementById('userIds');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyExcelBtn = document.getElementById('copyExcelBtn');
    const copyCsvBtn = document.getElementById('copyCsvBtn');
    const outputPreview = document.getElementById('outputPreview');
    const validationMessage = document.getElementById('validationMessage');
    const validationText = document.getElementById('validationText');
    const inputStats = document.getElementById('inputStats');
    const permStats = document.getElementById('permStats');
    const outputStats = document.getElementById('outputStats');
    const dropZone = document.getElementById('dropZone');
    const cleanUsersBtn = document.getElementById('cleanUsersBtn');
    const cleanPermsBtn = document.getElementById('cleanPermsBtn');
    const loadSampleBtn = document.getElementById('loadSampleBtn');

    // Type Toggles
    const typePermSet = document.getElementById('typePermSet');
    const typeLicense = document.getElementById('typeLicense');
    const prefixHint = document.getElementById('prefixHint');
    const lblPermSetIds = document.getElementById('lblPermSetIds');

    let csvContent = ''; // Store generated CSV blob content
    let clipboardContent = ''; // Store generated TSV for clipboard

    // --- Load Sample Logic ---
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            if (userIdsInput.value.trim() !== '' || permSetIdsInput.value.trim() !== '') {
                const proceed = window.confirm("This will overwrite your current input. Do you want to continue?");
                if (!proceed) return;
            }

            userIdsInput.value = window.SampleData.permissionSetAssigner.users;
            permSetIdsInput.value = window.SampleData.permissionSetAssigner.permSets;

            typePermSet.checked = true;
            updateUIForType();
            updateStats();
            updatePermStats();
            // Automatically generate
            generateCSV();
        });
    }

    // --- Event Listeners ---
    permSetIdsInput.addEventListener('input', () => {
        validateBase();
        updatePermStats();
    });
    userIdsInput.addEventListener('input', () => {
        validateBase();
        updateStats();
    });

    // Toggle handling
    [typePermSet, typeLicense].forEach(el => el.addEventListener('change', updateUIForType));

    generateBtn.addEventListener('click', generateCSV);

    downloadBtn.addEventListener('click', () => {
        if (!csvContent) return;
        downloadFile(csvContent, 'Assignment_Upload.csv', 'text/csv;charset=utf-8;');
    });

    copyExcelBtn.addEventListener('click', () => {
        if (!clipboardContent) return;

        copyToClipboard(clipboardContent, 'Excel format copied!');
        const originalText = copyExcelBtn.innerHTML;
        copyExcelBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i> Copied!';
        copyExcelBtn.classList.remove('btn-primary');
        copyExcelBtn.classList.add('btn-success');

        setTimeout(() => {
            copyExcelBtn.innerHTML = originalText;
            copyExcelBtn.classList.add('btn-primary');
            copyExcelBtn.classList.remove('btn-success');
        }, 1500);
    });

    copyCsvBtn.addEventListener('click', () => {
        if (!csvContent) return;

        copyToClipboard(csvContent, 'CSV format copied!');
        const originalText = copyCsvBtn.innerHTML;
        copyCsvBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i> Copied!';
        copyCsvBtn.classList.remove('btn-primary');
        copyCsvBtn.classList.add('btn-success');

        setTimeout(() => {
            copyCsvBtn.innerHTML = originalText;
            copyCsvBtn.classList.add('btn-primary');
            copyCsvBtn.classList.remove('btn-success');
        }, 1500);
    });

    cleanUsersBtn.addEventListener('click', () => {
        cleanInput(userIdsInput, '005');
        updateStats();
        validateBase();
    });

    cleanPermsBtn.addEventListener('click', () => {
        const isLicense = typeLicense.checked;
        const prefix = isLicense ? '0PL' : '0PS';
        cleanInput(permSetIdsInput, prefix);
        updatePermStats();
        validateBase();
    });

    // --- Logic ---

    function cleanInput(textarea, prefix) {
        const text = textarea.value;
        if (!text) return;

        // Regex to find 15 or 18 char IDs starting with prefix
        // boundaries \b ensure we don't cut words in half, though for IDs quotes/commas usually surround them.
        const regex = new RegExp(`\\b(${prefix}[a-zA-Z0-9]{15}|${prefix}[a-zA-Z0-9]{12})\\b`, 'g');

        const matches = text.match(regex);

        if (matches && matches.length > 0) {
            // Deduplicate
            const uniqueIds = [...new Set(matches)];
            textarea.value = uniqueIds.join('\n');

            // Optional: Feedback
            const btnId = textarea.id === 'userIds' ? 'cleanUsersBtn' : 'cleanPermsBtn';
            const btn = document.getElementById(btnId);
            const originalHtml = btn.innerHTML;

            btn.innerHTML = '<i class="bi bi-check"></i> Cleaned!';
            setTimeout(() => {
                btn.innerHTML = originalHtml;
            }, 1000);
        } else {
            // Check if there was input but no matches? 
            // Maybe user pasted wrong thing.
            if (text.trim().length > 0) {
                // No valid IDs found
                const btnId = textarea.id === 'userIds' ? 'cleanUsersBtn' : 'cleanPermsBtn';
                const btn = document.getElementById(btnId);
                const originalHtml = btn.innerHTML;

                btn.innerHTML = '<i class="bi bi-x"></i> None found';
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                }, 1000);
            }
        }
    }

    function updateUIForType() {
        const isLicense = typeLicense.checked;
        if (isLicense) {
            prefixHint.textContent = '0PL';
            lblPermSetIds.textContent = 'Permission Set License IDs (Targets)';
        } else {
            prefixHint.textContent = '0PS';
            lblPermSetIds.textContent = 'Permission Set IDs (Targets)';
        }
        validateBase();
    }

    function updateStats() {
        const text = userIdsInput.value;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        inputStats.textContent = `${lines.length} lines`;
    }

    function updatePermStats() {
        const text = permSetIdsInput.value;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        permStats.textContent = `${lines.length} lines`;
    }

    // Basic validation to enable/disable generate button (UX only)
    function validateBase() {
        validationMessage.classList.add('d-none');
    }

    function generateCSV() {
        const isLicense = typeLicense.checked;
        const targetPrefix = isLicense ? '0PL' : '0PS';
        const userPrefix = '005';

        const permText = permSetIdsInput.value;
        const userText = userIdsInput.value;

        // 1. Parse & Validate Perm IDs
        const permLines = permText.split(/\r?\n/);
        const validPermIds = [];
        const invalidPermIds = [];

        permLines.forEach(line => {
            const id = line.trim();
            if (!id) return;

            // Length check
            if (id.length !== 15 && id.length !== 18) {
                invalidPermIds.push(`${id} (length)`);
                return;
            }
            // Prefix check
            if (!id.startsWith(targetPrefix)) {
                invalidPermIds.push(`${id} (prefix)`);
                return;
            }
            validPermIds.push(id);
        });

        if (invalidPermIds.length > 0) {
            showError(`Invalid Target IDs found: ${invalidPermIds.slice(0, 3).join(', ')}${invalidPermIds.length > 3 ? '...' : ''}. Must start with ${targetPrefix} and be 15/18 chars.`);
            return;
        }

        if (validPermIds.length === 0) {
            showError('Please provide at least one valid Target ID.');
            return;
        }

        // 2. Parse & Validate User IDs
        const userLines = userText.split(/\r?\n/);
        const validUserIds = [];
        const invalidUserIds = [];

        userLines.forEach(line => {
            const id = line.trim();
            if (!id) return;

            if (id.length !== 15 && id.length !== 18) {
                invalidUserIds.push(`${id} (length)`);
                return;
            }
            if (!id.startsWith(userPrefix)) {
                invalidUserIds.push(`${id} (prefix)`);
                return;
            }
            validUserIds.push(id);
        });

        if (invalidUserIds.length > 0) {
            showError(`Invalid User IDs found: ${invalidUserIds.slice(0, 3).join(', ')}${invalidUserIds.length > 3 ? '...' : ''}. Must start with ${userPrefix}.`);
            return;
        }

        if (validUserIds.length === 0) {
            showError('Please provide at least one User ID.');
            return;
        }

        // Check Limit
        const projectedRows = validUserIds.length * validPermIds.length;
        if (projectedRows > 100000) {
            showError(`Result too large (${projectedRows.toLocaleString()} rows). Limit is 100,000 records.`);
            return;
        }

        // 3. Generate content
        const rows = [];

        if (isLicense) {
            // Header: "_","AssigneeId","PermissionSetLicenseId"
            rows.push('"_","AssigneeId","PermissionSetLicenseId"');
        } else {
            // Header: "_","AssigneeId","PermissionSetId"
            rows.push('"_","AssigneeId","PermissionSetId"');
        }

        let totalRows = 0;

        // Loop Perms x Users
        validPermIds.forEach(permId => {
            validUserIds.forEach(userId => {
                if (isLicense) {
                    // "[PermissionSetLicenseAssign]","005...","0PL..."
                    rows.push(`"[PermissionSetLicenseAssign]","${userId}","${permId}"`);
                } else {
                    // "[PermissionSetAssignment]","005...","0PS..."
                    rows.push(`"[PermissionSetAssignment]","${userId}","${permId}"`);
                }
                totalRows++;
            });
        });

        csvContent = rows.join('\n');

        // Generate Clipboard Content (TSV)
        // Simple regex replace for this strict format: replace "," with "	" (tab)
        clipboardContent = rows.map(r => r.replaceAll('","', '"\t"')).join('\n');

        // 4. Update Preview
        // Show first few lines
        outputPreview.value = csvContent;

        // Update Stats and UI
        outputStats.textContent = `${totalRows} rows generated`;
        validationMessage.classList.add('d-none');
        downloadBtn.disabled = false;
        copyExcelBtn.disabled = false;
        copyCsvBtn.disabled = false;

        // Flash success feedback
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="bi bi-check-circle"></i> Generated!';
        generateBtn.classList.remove('btn-primary');
        generateBtn.classList.add('btn-success');

        setTimeout(() => {
            generateBtn.innerHTML = originalText;
            generateBtn.classList.add('btn-primary');
            generateBtn.classList.remove('btn-success');
        }, 1500);
    }

    function showError(msg) {
        validationText.textContent = msg;
        validationMessage.classList.remove('d-none');
        downloadBtn.disabled = true;
        copyExcelBtn.disabled = true;
        copyCsvBtn.disabled = true;
        outputPreview.value = '';
        csvContent = '';
        clipboardContent = '';
    }

    // --- Drag and Drop ---

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop area
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('drag-active');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-active');
    }

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            readFile(files[0]);
        }
    }

    function readFile(file) {
        // Check if text/csv
        // Simple check, reading as text anyway
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function () {
            // Append or replace? Let's replace for simplicity as users usually drop a full list.
            userIdsInput.value = reader.result;
            updateStats();
            validateBase();
        };
    }

    // Initialize stats
    updateStats();
    updatePermStats();
});



function showToast(message = 'Copied to clipboard!') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    let toastEl = document.getElementById('globalToast');
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'globalToast';
        toastEl.className = 'toast align-items-center text-white bg-success border-0';
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');

        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-check-circle me-2"></i> <span id="toastMessage"></span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        toastContainer.appendChild(toastEl);
    }

    document.getElementById('toastMessage').innerText = message;

    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    } else {
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3000);
    }
}

function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMessage);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyTextToClipboard(text, successMessage);
        });
    } else {
        fallbackCopyTextToClipboard(text, successMessage);
    }
}

function fallbackCopyTextToClipboard(text, successMessage) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        if (successful) {
            showToast(successMessage);
        } else {
            console.error('Fallback: Copying text command was unsuccessful');
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
