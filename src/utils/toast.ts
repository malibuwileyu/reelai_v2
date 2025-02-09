type ToastType = 'success' | 'error' | 'info' | 'warning';

export const showToast = (message: string, type: ToastType = 'info') => {
  // For now, just console.log. We'll add a proper toast implementation later
  console.log(`[${type.toUpperCase()}] ${message}`);
}; 