// Notification System
class NotificationSystem {
    constructor() {
        this.timeout = null;
    }

    show(message, type = 'success', duration = 7000) { // Increased default duration to 7 seconds
        this.hide(); // Hide any existing notification
        
        const notification = document.createElement('div');
        notification.className = `local-toast ${type}`; // Using existing CSS class from styles.css
        
        if (type === 'processing') {
            notification.innerHTML = `
                <div class="notification-loader"></div>
                <span>${message}</span>
            `;
        } else {
            notification.textContent = message;
        }
        
        document.body.appendChild(notification);
        
        if (duration) {
            this.timeout = setTimeout(() => this.hide(), duration);
        }
        
        return notification;
    }

    hide() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        
        const existingNotification = document.querySelector('.local-toast');
        if (existingNotification) {
            existingNotification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (existingNotification.parentNode) {
                    existingNotification.parentNode.removeChild(existingNotification);
                }
            }, 300);
        }
    }
}

// Error Modal
class ErrorModal {
    constructor() {
        this.modal = null;
    }

    show(error) {
        if (this.modal) {
            document.body.removeChild(this.modal);
        }

        this.modal = document.createElement('div');
        this.modal.className = 'fixed inset-0 z-50 overflow-y-auto modal-overlay';
        this.modal.innerHTML = `
            <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div class="pandoc-error-modal modal-content relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div class="pandoc-error-header sm:flex sm:items-start">
                        <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg class="h-6 w-6 pandoc-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                            <h3 class="text-base font-semibold leading-6 text-gray-900">Error Converting File</h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500">${error}</p>
                            </div>
                        </div>
                    </div>
                    <div class="pandoc-error-actions mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button type="button" class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        const closeButton = this.modal.querySelector('button');
        closeButton.addEventListener('click', () => this.hide());
    }

    hide() {
        if (this.modal) {
            this.modal.classList.add('closing');
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                    this.modal = null;
                }
            }, 300);
        }
    }
}

/**
 * MarkdownApp - Main application controller for Markdowner
 * Handles markdown file processing and document conversion
 */
class MarkdownApp {
  /**
   * Initialize the markdown application
   */
  constructor() {
    // DOM element references (initialized in initDomElements)
    this.elements = {
      dropzone: null,
      fileInput: null,
      markdownInput: null,
      convertButton: null,
      markdownPreview: null
    };
    
    // Services
    this.services = {
      notifications: this.createNotificationsService()
    };
    
    // Current file information
    this.currentFile = null;
    
    // Bind methods to preserve 'this' context
    this.handleDrop = this.handleDrop.bind(this);
    this.handleFile = this.handleFile.bind(this);
    this.handleMarkdownInput = this.handleMarkdownInput.bind(this);
    this.handleConvertClick = this.handleConvertClick.bind(this);
    this.updateButtonState = this.updateButtonState.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    
    // Initialize app when DOM is fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }
  
  /**
   * Create a simple notification service
   * @returns {Object} Notification service API
   */
  createNotificationsService() {
    return {
      show: (message, type = 'info', duration = 3000) => {
        console.log(`Notification (${type}): ${message}`);
        
        // Find or create notification container
        let container = document.querySelector('.notification-container');
        if (!container) {
          container = document.createElement('div');
          container.className = 'notification-container';
          document.body.appendChild(container);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `local-toast ${type}`;
        toast.textContent = message;
        
        // Add to container
        container.appendChild(toast);
        
        // Auto-hide after duration if not persistent
        if (duration > 0) {
          setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => {
              if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
              }
            }, 300);
          }, duration);
        }
        
        return {
          hide: () => {
            toast.classList.add('hiding');
            setTimeout(() => {
              if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
              }
            }, 300);
          }
        };
      },
      hide: () => {
        const toasts = document.querySelectorAll('.local-toast');
        toasts.forEach(toast => {
          toast.classList.add('hiding');
          setTimeout(() => {
            if (toast.parentNode) {
              toast.parentNode.removeChild(toast);
            }
          }, 300);
        });
      }
    };
  }
  
  /**
   * Initialize the application
   */
  init() {
    console.log('Initializing MarkdownApp...');
    
    // Initialize DOM elements
    this.initDomElements();
    
    // Set up event listeners
    this.initEventListeners();
    
    // Initial button state update
    this.updateButtonState();
    
    console.log('MarkdownApp initialized successfully');
  }
  
  /**
   * Initialize DOM element references
   */
  initDomElements() {
    // Store references to DOM elements
    this.elements.dropzone = document.getElementById('dropzone');
    this.elements.fileInput = document.getElementById('fileInput');
    this.elements.markdownInput = document.getElementById('markdownInput');
    this.elements.convertButton = document.getElementById('convertButton');
    this.elements.markdownPreview = document.getElementById('markdownPreview');
    
    // Log missing elements for debugging
    const missingElements = [];
    Object.entries(this.elements).forEach(([key, element]) => {
      if (!element) missingElements.push(key);
    });
    
    if (missingElements.length > 0) {
      console.warn(`Missing DOM elements: ${missingElements.join(', ')}`);
    }
  }
  
  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Dropzone events
    if (this.elements.dropzone) {
      this.elements.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.elements.dropzone.classList.add('dragging');
      });
      
      this.elements.dropzone.addEventListener('dragleave', () => {
        this.elements.dropzone.classList.remove('dragging');
      });
      
      this.elements.dropzone.addEventListener('drop', this.handleDrop);
      
      this.elements.dropzone.addEventListener('click', () => {
        if (this.elements.fileInput) {
          this.elements.fileInput.click();
        }
      });
    }
    
    // File input event
    if (this.elements.fileInput) {
      this.elements.fileInput.addEventListener('change', () => {
        const file = this.elements.fileInput.files[0];
        if (file) {
          this.handleFile(file);
        }
      });
    }
    
    // Markdown input events
    if (this.elements.markdownInput) {
      this.elements.markdownInput.addEventListener('input', this.handleMarkdownInput);
      
      // Trigger initial update to reflect any pre-filled content
      this.handleMarkdownInput();
    }
    
    // Convert button
    if (this.elements.convertButton) {
      this.elements.convertButton.addEventListener('click', this.handleConvertClick);
    }
  }
  
  /**
   * Get the current markdown content
   * @returns {string} Markdown content or empty string
   */
  getMarkdownContent() {
    return this.elements.markdownInput ? 
      this.elements.markdownInput.value.trim() : '';
  }
  
  /**
   * Update the convert button state based on content
   */
  updateButtonState() {
    const button = this.elements.convertButton;
    if (!button) return;
    
    const hasContent = this.getMarkdownContent().length > 0;
    const hasFile = this.currentFile !== null;
    
    // Enable button if we have content or file
    button.disabled = !(hasContent || hasFile);
    
    // Update button text based on source
    if (hasFile) {
      button.querySelector('span.button-text').textContent = 'Convert File';
    } else if (hasContent) {
      button.querySelector('span.button-text').textContent = 'Convert Text';
    } else {
      button.querySelector('span.button-text').textContent = 'Export DOCX';
    }
    
    // Log button state
    console.log(`Button state updated: ${button.disabled ? 'disabled' : 'enabled'}, source: ${hasFile ? 'file' : (hasContent ? 'text' : 'none')}`);
  }
  
  /**
   * Handle markdown input changes
   */
  handleMarkdownInput() {
    // Clear current file selection when typing in the textarea
    if (this.getMarkdownContent().length > 0 && this.currentFile) {
      this.currentFile = null;
      
      // Clear file input
      if (this.elements.fileInput) {
        this.elements.fileInput.value = '';
      }
      
      // Reset dropzone
      if (this.elements.dropzone) {
        const fileInfo = this.elements.dropzone.querySelector('.file-info');
        if (fileInfo) {
          fileInfo.remove();
        }
        
        // Show the default content
        this.elements.dropzone.querySelectorAll('.default-content').forEach(el => {
          el.style.display = 'block';
        });
      }
    }
    
    this.updateButtonState();
  }
  
  /**
   * Handle file drop event
   * @param {DragEvent} event - Drop event
   */
  handleDrop(event) {
    event.preventDefault();
    
    if (this.elements.dropzone) {
      this.elements.dropzone.classList.remove('dragging');
    }
    
    if (event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.handleFile(file);
    }
  }
  
  /**
   * Process a selected or dropped file
   * @param {File} file - The file to process
   */
  handleFile(file) {
    // Check if it's a markdown file
    if (!file.name.toLowerCase().endsWith('.md') && 
        !file.type.includes('text/')) {
      this.services.notifications.show(
        'Please select a markdown (.md) file', 
        'error',
        5000
      );
      return;
    }
    
    // Store the current file
    this.currentFile = file;
    console.log('File selected:', file.name, 'size:', file.size);
    
    // Update the dropzone UI
    if (this.elements.dropzone) {
      // Hide default content
      this.elements.dropzone.querySelectorAll('.default-content').forEach(el => {
        el.style.display = 'none';
      });
      
      // Remove any existing file info
      const existingInfo = this.elements.dropzone.querySelector('.file-info');
      if (existingInfo) {
        existingInfo.remove();
      }
      
      // Create file info display
      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info space-y-2';
      
      const fileName = document.createElement('div');
      fileName.className = 'text-base font-medium text-gray-700 flex items-center';
      fileName.innerHTML = `
        <svg class="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        ${file.name}
      `;
      
      const fileSize = document.createElement('div');
      fileSize.className = 'text-sm text-gray-500';
      fileSize.textContent = `Size: ${this.formatFileSize(file.size)}`;
      
      const removeButton = document.createElement('button');
      removeButton.className = 'mt-2 text-sm text-red-500 hover:text-red-700';
      removeButton.textContent = 'Remove file';
      removeButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the dropzone click
        this.currentFile = null;
        if (this.elements.fileInput) {
          this.elements.fileInput.value = '';
        }
        
        // Show default content
        this.elements.dropzone.querySelectorAll('.default-content').forEach(el => {
          el.style.display = 'block';
        });
        
        // Remove file info
        fileInfo.remove();
        
        this.updateButtonState();
      });
      
      fileInfo.appendChild(fileName);
      fileInfo.appendChild(fileSize);
      fileInfo.appendChild(removeButton);
      
      this.elements.dropzone.appendChild(fileInfo);
    }
    
    // Read first few lines to show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      // Only show a preview if the textarea is empty
      if (this.elements.markdownInput && !this.getMarkdownContent()) {
        const content = e.target.result;
        const preview = content.split('\n').slice(0, 3).join('\n');
        this.elements.markdownInput.value = preview + (content.split('\n').length > 3 ? '\n...' : '');
        this.elements.markdownInput.classList.add('preview-mode');
      }
    };
    reader.readAsText(file.slice(0, 1000)); // Read only first 1000 bytes for preview
    
    // Update button state
    this.updateButtonState();
  }
  
  /**
   * Format file size in bytes to human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} bytes`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  
  /**
   * Handle convert button click
   */
  handleConvertClick() {
    // If we have a file, use that for conversion
    if (this.currentFile) {
      this.uploadFile(this.currentFile);
      return;
    }
    
    // Otherwise use the markdown text
    const markdown = this.getMarkdownContent();
    
    if (!markdown) {
      this.services.notifications.show(
        'Please enter some markdown text or select a file', 
        'error',
        5000
      );
      return;
    }
    
    // Show loading state
    const button = this.elements.convertButton;
    if (button) {
      button.disabled = true;
      button.classList.add('loading');
    }
    
    this.services.notifications.show(
      'Converting document...', 
      'processing', 
      0
    );
    
    // Send conversion request
    this.sendConversionRequest(markdown);
  }
  
  /**
   * Upload a file for conversion
   * @param {File} file - File to upload
   */
  uploadFile(file) {
    console.log('Uploading file for conversion:', file.name);
    
    // Show loading state
    const button = this.elements.convertButton;
    if (button) {
      button.disabled = true;
      button.classList.add('loading');
    }
    
    this.services.notifications.show(
      `Converting file: ${file.name}...`, 
      'processing', 
      0
    );
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file); 
    
    // Send the file to server
    fetch('/convert', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      // Reset button state
      if (button) {
        button.classList.remove('loading');
        this.updateButtonState();
      }
      
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || data.details || 'Unknown server error');
        });
      }
      
      const contentType = response.headers.get('Content-Type');
      
      if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument')) {
        return response.blob();
      }
      
      return response.json().then(data => {
        throw new Error(data.error || data.details || 'Unknown server error');
      });
    })
    .then(blob => {
      // Create and trigger download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}.docx`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      // Show success message
      this.services.notifications.hide();
      this.services.notifications.show(
        `File "${file.name}" converted successfully!`, 
        'success'
      );
    })
    .catch(error => {
      console.error('File upload error:', error);
      
      // Show error notification
      this.services.notifications.hide();
      this.services.notifications.show(
        `Error: ${error.message || 'Failed to convert file'}`,
        'error',
        8000
      );
      
      // Reset button state
      if (button) {
        this.updateButtonState();
      }
    });
  }
  
  /**
   * Send conversion request to server for markdown text
   * @param {string} markdown - Markdown content
   */
  sendConversionRequest(markdown) {
    fetch('/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ markdown }),
    })
    .then(response => {
      // Reset button state
      const button = this.elements.convertButton;
      if (button) {
        button.classList.remove('loading');
        this.updateButtonState();
      }
      
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || data.details || 'Unknown server error');
        });
      }
      
      const contentType = response.headers.get('Content-Type');
      
      if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument')) {
        return response.blob();
      }
      
      return response.json().then(data => {
        throw new Error(data.error || data.details || 'Unknown server error');
      });
    })
    .then(blob => {
      // Create and trigger download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.docx';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      // Show success message
      this.services.notifications.hide();
      this.services.notifications.show(
        'Document converted successfully!', 
        'success'
      );
    })
    .catch(error => {
      console.error('Conversion error:', error);
      
      // Show error notification
      this.services.notifications.hide();
      this.services.notifications.show(
        `Error: ${error.message || 'Failed to convert document'}`,
        'error',
        8000
      );
      
      // Reset button state
      const button = this.elements.convertButton;
      if (button) {
        this.updateButtonState();
      }
    });
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.markdownApp = new MarkdownApp();
});