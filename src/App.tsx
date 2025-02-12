import { useEffect } from 'react';
import { LogBox } from 'react-native';

export default function App() {
  useEffect(() => {
    // Global error handler for uncaught errors
    const errorHandler = (event: ErrorEvent) => {
      console.error('[Global Error]', {
        name: event.error?.name || 'Unknown Error',
        message: event.error?.message || event.message,
        stack: event.error?.stack,
        type: event.type
      });
    };

    // Global promise rejection handler
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('[Unhandled Promise Rejection]', {
        reason: event.reason,
        type: event.type
      });
    };

    // Set up error handlers
    if (global.addEventListener) {
      global.addEventListener('error', errorHandler as EventListener);
      global.addEventListener('unhandledrejection', rejectionHandler as EventListener);
    }

    // Clean up
    return () => {
      if (global.removeEventListener) {
        global.removeEventListener('error', errorHandler as EventListener);
        global.removeEventListener('unhandledrejection', rejectionHandler as EventListener);
      }
    };
  }, []);

  // ... rest of App component code ...
} 