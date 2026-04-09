/**
 * Security Utilities for Enterprise AI Safety
 */

/**
 * Enterprise PII Scrubber: Redacts sensitive patterns (emails, phone numbers)
 * to ensure that no sensitive data is sent to external LLMs or vector embedding models.
 * Fulfills the 'AI Safety: No sensitive data in training' requirement.
 * @param {string} text - The input text to be scrubbed.
 * @returns {string} - The scrubbed text with [REDACTED] flags.
 */
export const scrubPII = (text) => {
    if (!text) return text;
    return text
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
        .replace(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[PHONE_REDACTED]');
};
