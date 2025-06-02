/**
 * Generates a oneM2M-compliant timestamp in the format YYYYMMDDTHHmmss
 * @returns {string} The formatted timestamp string (eg: "20250414T143255")
 */
export function getTimestamp(): string {
    const date = new Date();

    // Convert to UTC and format as YYYYMMDDTHHMMSS
    const pad = (n: number): string => n.toString().padStart(2, '0');

    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1); // Months are zero-based
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());

    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}