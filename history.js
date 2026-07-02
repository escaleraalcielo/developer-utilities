// Shared session-history helper for Dev Utils tool pages.
// Exposes window.HistoryManager.
(function () {
    'use strict';

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function fallbackCopyTextToClipboard(text, successMessage) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;

        const instruction = document.createElement('p');
        instruction.textContent = 'Press Ctrl+C (Cmd+C on Mac) to copy, then close this dialog';
        instruction.style.cssText = `
            margin: 0 0 16px 0;
            color: #333;
            font-size: 14px;
            font-weight: 500;
        `;

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = `
            width: 100%;
            min-height: 120px;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-family: monospace;
            font-size: 13px;
            resize: vertical;
            box-sizing: border-box;
            margin-bottom: 16px;
        `;
        textarea.readOnly = true;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            background: #0d6efd;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            float: right;
        `;

        container.appendChild(instruction);
        container.appendChild(textarea);
        container.appendChild(closeBtn);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        textarea.focus();
        textarea.select();

        const closeModal = () => {
            document.body.removeChild(overlay);
            showToast(successMessage);
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escHandler);
                closeModal();
            }
        });
    }

    function showToast(message) {
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
            setTimeout(() => toastEl.classList.remove('show'), 3000);
        }
    }

    function copyText(text, successMessage) {
        successMessage = successMessage || 'Copied to clipboard!';
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => showToast(successMessage)).catch(() => {
                fallbackCopyTextToClipboard(text, successMessage);
            });
        } else {
            fallbackCopyTextToClipboard(text, successMessage);
        }
    }

    class HistoryManager {
        constructor(config) {
            this.config = Object.assign({
                limit: 10,
                tableBodyId: 'historyTableBody',
                countId: 'historyCount',
                emptyText: 'No saved results in this session.',
                getType: () => 'Result',
                getPreview: (item) => item.preview || ''
            }, config);

            this.items = [];
            this.tableBody = document.getElementById(this.config.tableBodyId);
            this.countEl = document.getElementById(this.config.countId);
            this.render();
        }

        add(item) {
            if (!item || !item.value) return;

            // Avoid duplicate top item
            if (this.items.length > 0 && this.items[0].value === item.value) {
                return;
            }

            item.id = item.id || Date.now();
            item.timestamp = item.timestamp || new Date().toLocaleTimeString();

            this.items.unshift(item);
            if (this.items.length > this.config.limit) {
                this.items.pop();
            }

            this.render();
        }

        copy(id) {
            const item = this.items.find(i => i.id === id);
            if (item && item.value) {
                copyText(item.value, 'Copied from history.');
            }
        }

        delete(id) {
            this.items = this.items.filter(i => i.id !== id);
            this.render();
        }

        render() {
            if (this.countEl) {
                this.countEl.textContent = `${this.items.length}/${this.config.limit}`;
            }

            if (!this.tableBody) return;

            if (this.items.length === 0) {
                this.tableBody.innerHTML = `
                    <tr class="text-center">
                        <td colspan="4" class="py-4 text-secondary opacity-50 fst-italic">${escapeHtml(this.config.emptyText)}</td>
                    </tr>`;
                return;
            }

            this.tableBody.innerHTML = '';
            this.items.forEach(item => {
                const type = this.config.getType(item);
                const preview = this.config.getPreview(item);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="align-middle text-secondary">${escapeHtml(item.timestamp)}</td>
                    <td class="align-middle text-info">${escapeHtml(type)}</td>
                    <td class="align-middle text-truncate" style="max-width: 300px;">
                        <code class="text-light">${escapeHtml(preview)}</code>
                    </td>
                    <td class="align-middle text-end">
                        <button class="btn btn-sm btn-link text-primary p-0 me-2" title="Copy"><i class="bi bi-clipboard"></i></button>
                        <button class="btn btn-sm btn-link text-danger p-0" title="Delete"><i class="bi bi-trash"></i></button>
                    </td>
                `;
                const [copyBtn, deleteBtn] = tr.querySelectorAll('button');
                copyBtn.addEventListener('click', () => this.copy(item.id));
                deleteBtn.addEventListener('click', () => this.delete(item.id));
                this.tableBody.appendChild(tr);
            });
        }
    }

    if (typeof window !== 'undefined') {
        window.HistoryManager = HistoryManager;
    }
})();
