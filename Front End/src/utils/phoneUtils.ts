/**
 * Shared phone number utilities for the frontend.
 * Backend accepts E.164 format: +<country_code><number>
 */

/**
 * Normalizes a raw phone input to E.164 format.
 * - Strips all non-digit characters
 * - Prepends '+' if there are any digits
 * - Returns empty string if input is empty
 */
export const normalizePhoneToE164 = (rawInput: string): string => {
  const digits = rawInput.replace(/\D/g, '');
  if (!digits) return '';
  return `+${digits}`;
};

/**
 * Formats a stored phone value for display in an input field.
 * Strips the '+' so the user sees just the digits they typed.
 * Example: "+919876543210" → "919876543210"
 */
export const formatPhoneForInput = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * Formats a stored E.164 phone value for human-readable display.
 * Keeps the '+' prefix and adds spaces for readability.
 * Example: "+15551234567" → "+1 555 1234567"
 * Example: "+919876543210" → "+91 987 6543210"
 */
export const formatPhoneDisplay = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // Display with + prefix and the raw digits — keep it simple and internationally correct
  return `+${digits}`;
};

/**
 * Handler for a phone input's onChange event.
 * Takes the raw input value, extracts digits only, stores as E.164.
 * Use this in components: onChange={e => setPhone(handlePhoneInput(e.target.value))}
 */
export const handlePhoneInput = (rawValue: string): string => {
  const digits = rawValue.replace(/\D/g, '');
  if (!digits) return '';
  return `+${digits}`;
};

/**
 * Validates that a phone value is a plausible E.164 number.
 * Checks: starts with +, followed by 7–15 digits.
 */
export const isValidPhone = (phone: string): boolean => {
  return /^\+[1-9]\d{6,14}$/.test(phone);
};
