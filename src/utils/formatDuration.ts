/**
 * Formats duration in seconds to a time string.
 * Format examples:
 * - 3 seconds -> "0:03"
 * - 65 seconds -> "1:05"
 * - 605 seconds (10:05) -> "10:05"
 * - 3605 seconds (1:00:05) -> "1:00:05"
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  // Format components with leading zeros
  const paddedSeconds = remainingSeconds.toString().padStart(2, '0');
  
  if (hours > 0) {
    // Format: H:MM:SS
    const paddedMinutes = minutes.toString().padStart(2, '0');
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  } else if (minutes >= 10) {
    // Format: MM:SS (for 10 minutes or more)
    return `${minutes}:${paddedSeconds}`;
  } else {
    // Format: M:SS (for less than 10 minutes)
    return `${minutes}:${paddedSeconds}`;
  }
} 