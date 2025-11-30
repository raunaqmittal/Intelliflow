import { AxiosError } from 'axios';

/**
 * Extract user-friendly error message from various error types
 * @param err - Error object (can be AxiosError, NetworkError, TimeoutError, or generic Error)
 * @param defaultMessage - Default message if no specific error message found
 * @returns User-friendly error message
 */
export function getErrorMessage(err: unknown, defaultMessage: string = 'An error occurred. Please try again.'): string {
  // Handle network errors (no internet connection)
  if (err instanceof Error && err.name === 'NetworkError') {
    return 'Network error. Please check your internet connection.';
  }
  
  // Handle timeout errors
  if (err instanceof Error && err.name === 'TimeoutError') {
    return 'Request timeout. Please try again.';
  }
  
  // Handle Axios errors (API responses)
  if (err instanceof AxiosError) {
    // Server responded with error message
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    
    // Server responded with error status
    if (err.response?.status === 401) {
      return 'Unauthorized. Please log in again.';
    }
    
    if (err.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (err.response?.status === 404) {
      return 'Resource not found.';
    }
    
    if (err.response?.status === 429) {
      return 'Too many requests. Please try again later.';
    }
    
    if (err.response?.status && err.response.status >= 500) {
      return 'Server error. Please try again later.';
    }
  }
  
  // Handle generic errors with message
  if (err instanceof Error && err.message) {
    return err.message;
  }
  
  // Fallback to default message
  return defaultMessage;
}

/**
 * Log error details for debugging (can be enhanced with error reporting service)
 * @param err - Error object
 * @param context - Context where error occurred (e.g., 'Login', 'Profile Update')
 */
export function logError(err: unknown, context: string): void {
  console.error(`[${context}] Error:`, err);
  
  // In production, you could send this to an error tracking service like Sentry
  if (import.meta.env.PROD) {
    // TODO: Send to error tracking service
    // Example: Sentry.captureException(err, { tags: { context } });
  }
}
