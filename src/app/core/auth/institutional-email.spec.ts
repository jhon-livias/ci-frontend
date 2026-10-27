import { allowsLoginIdentifier, institutionalEmail } from './institutional-email';

describe('institutional email', () => {
  it('accepts the institutional domain and rejects lookalikes', () => {
    expect(institutionalEmail(' Carlos@UPRIT.EDU.PE ')).toBe('carlos@uprit.edu.pe');
    expect(institutionalEmail('carlos@gmail.com')).toBeNull();
    expect(institutionalEmail('carlos@uprit.edu.pe.evil.com')).toBeNull();
    expect(institutionalEmail('carlos..haro@uprit.edu.pe')).toBeNull();
  });

  it('allows a username and only an institutional email', () => {
    expect(allowsLoginIdentifier('admin')).toBe(true);
    expect(allowsLoginIdentifier('admin@uprit.edu.pe')).toBe(true);
    expect(allowsLoginIdentifier('admin@gmail.com')).toBe(false);
  });
});