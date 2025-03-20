import { dom } from './utils.js';

/**
 * UI component factory for the Markdowner application
 */
export const components = {
  /**
   * Create a toast notification component
   * @param {Object} options - Notification options
   * @returns {HTMLElement} Toast notification element
   */
  createToast(options = {}) {
    const { message, type = 'info', duration = 3000 } = options;
    
    return dom.createElement('div', {
      className: `local-toast ${type}`,
      dataset: {
        duration: duration.toString()
      }
    }, message);
  },
  
  /**
   * Create a button with loading state support
   * @param {Object} options - Button options
   * @returns {HTMLElement} Button element
   */
  createButton(options = {}) {
    const { 
      text, 
      onClick, 
      type = 'primary', 
      icon = null,
      disabled = false
    } = options;
    
    const buttonContent = [];
    
    // Add icon if provided
    if (icon) {
      buttonContent.push(
        dom.createElement('span', {
          className: 'button-icon'
        }, icon)
      );
    }
    
    // Add text
    buttonContent.push(text);
    
    // Add loading spinner (hidden by default)
    buttonContent.push(
      dom.createElement('span', {
        className: 'loading-spinner hidden'
      })
    );
    
    return dom.createElement('button', {
      className: `button ${type}-button`,
      disabled: disabled,
      onClick: onClick
    }, buttonContent);
  }
};

/**
 * NotificationService - Manages application notifications
 */
export class NotificationService {
  constructor() {
    this.container = this.createContainer();
    document.body.appendChild(this.container);
  }
  
  /**
   * Create notification container
   * @returns {HTMLElement} Container element
   */
  createContainer() {
    return dom.createElement('div', {
      className: 'notification-container'
    });
  }
  
  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, success, error, warning)
   * @param {number} duration - Duration in milliseconds (0 for persistent)
   * @returns {Object} Object with methods to control the notification
   */
  show(message, type = 'info', duration = 3000) {
    const toast = components.createToast({
      message,
      type,
      duration
    });
    
    this.container.appendChild(toast);
    
    // Auto-hide after duration if not persistent
    let timeoutId = null;
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        this.hideToast(toast);
      }, duration);
    }
    
    // Return controller object
    return {
      hide: () => {
        if (timeoutId) clearTimeout(timeoutId);
        this.hideToast(toast);
      },
      update: (newMessage) => {
        toast.textContent = newMessage;
      }
    };
  }
  
  /**
   * Hide a specific toast notification
   * @param {HTMLElement} toast - Toast element to hide
   */
  hideToast(toast) {
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300); // Match CSS transition duration
  }
  
  /**
   * Hide all notifications
   */
  hideAll() {
    const toasts = this.container.querySelectorAll('.local-toast');
    toasts.forEach(toast => this.hideToast(toast));
  }
}