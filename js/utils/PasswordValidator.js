/**
 * Utility: PasswordValidator
 * Pure domain logic for password strength scoring.
 * No dependencies — can be tested in isolation.
 */
export class PasswordValidator {
  static validate(password) {
    if (!password || password.length < 12) {
      return { score: 0, isValid: false, label: 'Too Short (Min 12)' };
    }

    let score = 0;
    if (password.length >= 12)       score++;
    if (/[A-Z]/.test(password))      score++;
    if (/[a-z]/.test(password))      score++;
    if (/[0-9]/.test(password))      score++;
    if (/[@$!%*?&]/.test(password))  score++;

    const label = score <= 2 ? 'Weak' : score <= 4 ? 'Medium' : 'Strong';

    return { score, isValid: score === 5, label };
  }
}
