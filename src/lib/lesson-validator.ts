export interface ValidationResult {
  passed: boolean;
  failedPatterns: string[];
  message: string;
}

export interface TestCase {
  id?: string;
  description: string;
  input?: string;
  expectedOutput: string;
}

export interface TestResult extends ValidationResult {
  testCase: TestCase;
}

function asRegExp(pattern: string): RegExp | null {
  if (!pattern.startsWith('/') || pattern.lastIndexOf('/') <= 0) {
    return null;
  }

  const lastSlash = pattern.lastIndexOf('/');
  const source = pattern.slice(1, lastSlash);
  const flags = pattern.slice(lastSlash + 1);

  try {
    return new RegExp(source, flags);
  } catch {
    return null;
  }
}

function hasPattern(code: string, pattern: string): boolean {
  const regex = asRegExp(pattern);
  if (regex) return regex.test(code);
  return code.includes(pattern);
}

export function validateCode(code: string, patterns: string[]): ValidationResult {
  if (patterns.length === 0) {
    return {
      passed: true,
      failedPatterns: [],
      message: 'No validation patterns configured for this challenge.',
    };
  }

  const failedPatterns = patterns.filter((pattern) => !hasPattern(code, pattern));
  const passed = failedPatterns.length === 0;

  return {
    passed,
    failedPatterns,
    message: passed
      ? 'All tests passed!'
      : `Missing ${failedPatterns.length} required pattern${failedPatterns.length === 1 ? '' : 's'}.`,
  };
}

export function validateTestCases(
  code: string,
  testCases: TestCase[],
): TestResult[] {
  return testCases.map((testCase) => {
    const validation = validateCode(code, [testCase.expectedOutput]);
    return {
      ...validation,
      testCase,
    };
  });
}
