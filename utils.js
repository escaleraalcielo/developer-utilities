function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHtml };
}

// Ensure escapeHtml is also available on window for browser usage
if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
}
