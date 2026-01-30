document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const permSetIdsInput = document.getElementById('permSetIds'); // Changed ID
    const userIdsInput = document.getElementById('userIds');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const outputPreview = document.getElementById('outputPreview');
    const validationMessage = document.getElementById('validationMessage');
    const validationText = document.getElementById('validationText');
    const inputStats = document.getElementById('inputStats');
    const outputStats = document.getElementById('outputStats');
    const dropZone = document.getElementById('dropZone');

    // Type Toggles
    const typePermSet = document.getElementById('typePermSet');
    const typeLicense = document.getElementById('typeLicense');
    const prefixHint = document.getElementById('prefixHint');
    const lblPermSetIds = document.getElementById('lblPermSetIds');

    let csvContent = ''; // Store generated CSV blob content

    // --- Event Listeners ---
    permSetIdsInput.addEventListener('input', validateBase);
    userIdsInput.addEventListener('input', () => {
        validateBase();
        updateStats();
    });

    // Toggle handling
    [typePermSet, typeLicense].forEach(el => el.addEventListener('change', updateUIForType));

    generateBtn.addEventListener('click', generateCSV);

    downloadBtn.addEventListener('click', () => {
        if (!csvContent) return;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Assignment_Upload.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- Logic ---

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

        // 4. Update Preview
        // Show first few lines
        outputPreview.value = csvContent;

        // Update Stats and UI
        outputStats.textContent = `${totalRows} rows generated`;
        validationMessage.classList.add('d-none');
        downloadBtn.disabled = false;

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
        outputPreview.value = '';
        csvContent = '';
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
});
