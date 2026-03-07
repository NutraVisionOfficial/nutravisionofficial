// Common leaked passwords (top 100 from HaveIBeenPwned lists)
const COMMON_PASSWORDS = new Set([
  "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234",
  "111111", "1234567", "dragon", "123123", "baseball", "abc123", "football",
  "monkey", "letmein", "shadow", "master", "666666", "qwertyuiop",
  "123321", "mustang", "1234567890", "michael", "654321", "superman",
  "1qaz2wsx", "7777777", "121212", "000000", "qazwsx", "123qwe",
  "killer", "trustno1", "jordan", "jennifer", "zxcvbnm", "asdfgh",
  "hunter", "buster", "soccer", "harley", "batman", "andrew", "tigger",
  "sunshine", "iloveyou", "2000", "charlie", "robert", "thomas", "hockey",
  "ranger", "daniel", "starwars", "klaster", "112233", "george", "computer",
  "michelle", "jessica", "pepper", "1111", "zxcvbn", "555555", "11111111",
  "131313", "freedom", "777777", "pass", "maggie", "159753", "aaaaaa",
  "ginger", "princess", "joshua", "cheese", "amanda", "summer", "love",
  "ashley", "nicole", "chelsea", "biteme", "matthew", "access", "yankees",
  "987654321", "dallas", "austin", "thunder", "taylor", "matrix", "welcome",
  "password1", "password123", "letmein1", "admin", "admin123", "root",
  "toor", "pass123", "changeme", "welcome1", "p@ssw0rd", "passw0rd",
]);

export interface PasswordCheck {
  label: string;
  passed: boolean;
}

export interface PasswordValidation {
  checks: PasswordCheck[];
  score: number; // 0-5
  isValid: boolean;
}

export function validatePassword(password: string): PasswordValidation {
  const checks: PasswordCheck[] = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "Contains uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Contains a number", passed: /\d/.test(password) },
    { label: "Contains special character", passed: /[^A-Za-z0-9]/.test(password) },
    { label: "Not a commonly leaked password", passed: password.length > 0 && !COMMON_PASSWORDS.has(password.toLowerCase()) },
  ];

  const score = checks.filter((c) => c.passed).length;
  const isValid = checks.every((c) => c.passed);

  return { checks, score, isValid };
}

export function getStrengthLabel(score: number): { label: string; color: string } {
  if (score <= 2) return { label: "Weak", color: "text-destructive" };
  if (score <= 4) return { label: "Fair", color: "text-yellow-500" };
  if (score <= 5) return { label: "Good", color: "text-blue-500" };
  return { label: "Strong", color: "text-green-500" };
}
