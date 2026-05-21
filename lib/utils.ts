import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a URL-friendly slug from an email address
 * Takes the part before @ and removes/replaces non-URL-safe characters
 *
 * Examples:
 *   bert@gmail.com -> bert
 *   jane.doe@example.com -> janedoe
 *   john+test@domain.com -> johntest
 */
export function generateSlugFromEmail(email: string): string {
  // Get part before @
  const localPart = email.split('@')[0];

  // Remove all non-alphanumeric characters and convert to lowercase
  const slug = localPart
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  return slug;
}

/**
 * Format a person's name as "First L." with email as fallback
 *
 * Examples:
 *   formatDisplayName("John", "Doe", "john@example.com") -> "John D."
 *   formatDisplayName(null, null, "john@example.com") -> "john@example.com"
 *   formatDisplayName("John", null, "john@example.com") -> "john@example.com"
 *
 * @param firstName - User's first name (can be null/undefined)
 * @param lastName - User's last name (can be null/undefined)
 * @param email - User's email (fallback if names not available)
 * @returns Formatted display name
 */
export function formatDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string
): string {
  // If we have both first and last name, format as "First L."
  if (firstName && lastName) {
    return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
  }

  // Otherwise, fall back to email
  return email;
}

/**
 * Parse a full name into first and last name, then format as "First L."
 * Used for guest bookings where we only have a single name field.
 *
 * Examples:
 *   formatGuestName("John Doe") -> "John D."
 *   formatGuestName("John") -> "John"
 *   formatGuestName("John Smith Anderson") -> "John A." (uses last word as last name)
 *   formatGuestName("") -> "Guest"
 *
 * @param fullName - The person's full name as a single string
 * @returns Formatted display name as "First L." or fallback
 */
export function formatGuestName(fullName: string | null | undefined): string {
  if (!fullName || fullName.trim() === '') {
    return 'Guest';
  }

  const nameParts = fullName.trim().split(/\s+/);

  if (nameParts.length === 1) {
    // Only first name provided
    return nameParts[0];
  }

  // First name is the first part, last name is the last part
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];

  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}
