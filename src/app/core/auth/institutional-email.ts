export const INSTITUTIONAL_EMAIL_DOMAIN = 'uprit.edu.pe';
export const INSTITUTIONAL_EMAIL_MESSAGE = 'Solo se acepta el dominio @uprit.edu.pe.';

const LOCAL_PART = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?$/u;

export const institutionalEmail = (value: string): string | null => {
  const email = value.normalize('NFKC').trim().toLowerCase();
  const at = email.indexOf('@');
  if (at < 1 || at !== email.lastIndexOf('@')) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (domain !== INSTITUTIONAL_EMAIL_DOMAIN || local.includes('..') || !LOCAL_PART.test(local)) return null;
  return email;
};

export const allowsLoginIdentifier = (value: string): boolean => {
  const identifier = value.normalize('NFKC').trim().toLowerCase();
  return !identifier.includes('@') || institutionalEmail(identifier) !== null;
};
