import { describe, it, expect } from 'vitest';
import { escapeCsvFormulaInjection } from '../../packages/shared/src/csvValidator';

describe('CSV Formula Injection Prevention', () => {
  it('escapes cells starting with =, +, -, @', () => {
    expect(escapeCsvFormulaInjection('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(escapeCsvFormulaInjection('+1234567890')).toBe("'+1234567890");
    expect(escapeCsvFormulaInjection('-50% Discount')).toBe("'-50% Discount");
    expect(escapeCsvFormulaInjection('@cmd|/C calc')).toBe("'@cmd|/C calc");
  });

  it('escapes cells starting with whitespace/tab/carriage return followed by formula characters', () => {
    expect(escapeCsvFormulaInjection('\t=cmd')).toBe("'\t=cmd");
    expect(escapeCsvFormulaInjection('\r=cmd')).toBe("'\r=cmd");
  });

  it('leaves safe standard alphanumeric strings untouched', () => {
    expect(escapeCsvFormulaInjection('Chennai Cricket Academy')).toBe('Chennai Cricket Academy');
    expect(escapeCsvFormulaInjection('info@business.com')).toBe('info@business.com');
    expect(escapeCsvFormulaInjection('https://example.com')).toBe('https://example.com');
    expect(escapeCsvFormulaInjection('')).toBe('');
    expect(escapeCsvFormulaInjection(null)).toBe('');
  });
});
