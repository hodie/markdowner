/**
 * Utility functions for the Markdowner application
 */

/**
 * Check if a string is empty or contains only whitespace
 * @param {string} str - String to check
 * @returns {boolean} True if string is empty or whitespace only
 */
export function isEmpty(str) {
  return !str || str.trim().length === 0;
}

/**
 * Create a debounced version of a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format a file size in bytes to a human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Safe access to localStorage with error handling
 */
export const storage = {
  /**
   * Get a value from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Retrieved value or default
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting item "${key}" from localStorage:`, error);
      return defaultValue;
    }
  },
  
  /**
   * Set a value in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting item "${key}" in localStorage:`, error);
      return false;
    }
  }
};

/**
 * DOM manipulation helpers
 */
export const dom = {
  /**
   * Create an element with attributes and children
   * @param {string} tag - HTML tag name
   * @param {Object} attrs - Element attributes
   * @param {Array|string} children - Child elements or text content
   * @returns {HTMLElement} Created element
   */
  createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Add children
    if (typeof children === 'string') {
      element.textContent = children;
    } else if (Array.isArray(children)) {
      children.forEach(child => {
        if (child instanceof Node) {
          element.appendChild(child);
        } else if (child) {
          element.appendChild(document.createTextNode(String(child)));
        }
      });
    }
    
    return element;
  }
};