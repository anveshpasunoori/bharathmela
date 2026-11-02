const COMMON = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop",
  "11111111", "00000000", "iloveyou", "abcd1234", "abc12345", "welcome1", "letmein1", "sunshine",
  "football", "baseball", "princess", "superman", "india123", "bharat123", "changeme", "admin123",
]);

// Returns an error message, or null if the password is acceptable.
export function passwordProblem(password: string, email: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password is too long.";
  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return "That password is too common. Pick something harder to guess.";
  if (lower === email.toLowerCase() || lower === email.split("@")[0].toLowerCase()) {
    return "Password can't be your email address.";
  }
  if (/^(.)\1+$/.test(password)) return "Password can't be one repeated character.";
  return null;
}
