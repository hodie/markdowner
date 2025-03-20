// Creating a separate module for clipboard functionality

/**
 * ClipboardHandler - Manages rich text clipboard operations
 */
class ClipboardHandler {
    /**
     * Copy RTF content to clipboard
     * @param {string} rtfContent - The RTF formatted content
     * @returns {Promise<boolean>} - Success status
     */
    static async copyRichTextToClipboard(rtfContent) {
        try {
            // For browsers that support ClipboardItem
            if (window.ClipboardItem) {
                const blobInput = new Blob([rtfContent], { type: 'text/rtf' });
                
                // Create a ClipboardItem with RTF content type
                const clipboardItem = new ClipboardItem({
                    'text/rtf': blobInput,
                    'text/plain': new Blob([stripRtfFormatting(rtfContent)], { type: 'text/plain' })
                });
                
                await navigator.clipboard.write([clipboardItem]);
                return true;
            } else {
                // Fallback for browsers without ClipboardItem support
                // Create a temporary textarea element
                const textArea = document.createElement('textarea');
                textArea.value = stripRtfFormatting(rtfContent); // Plain text fallback
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (!success) {
                    throw new Error('Failed to copy using execCommand');
                }
                
                // Show warning about limited format support
                console.warn('Using fallback clipboard method - formatting may be limited');
                return true;
            }
        } catch (err) {
            console.error('Clipboard error:', err);
            throw new Error('Failed to copy to clipboard: ' + err.message);
        }
    }
}

/**
 * Helper function to strip RTF formatting for plain text fallback
 * @param {string} rtfContent - RTF content to strip
 * @returns {string} - Plain text content
 */
function stripRtfFormatting(rtfContent) {
    // Simple RTF stripping - in a real app, you might want a more robust solution
    return rtfContent
        .replace(/\{\\rtf[^{}]*/, '') // Remove RTF header
        .replace(/\\\w+\s?/g, '') // Remove RTF commands
        .replace(/\{|\}/g, '') // Remove braces
        .replace(/\\['"]/g, '') // Remove escaped quotes
        .replace(/\\\n/g, '\n') // Fix newlines
        .trim();
}

// Export the class for importing in other modules
export default ClipboardHandler;