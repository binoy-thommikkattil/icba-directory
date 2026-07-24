export const DEFAULT_COUNTRY_CODE = '+91';

export const COUNTRY_CODE_OPTIONS = ['+91', '+1', '+44', '+61', '+971', '+974', '+965', '+966'];

export type PhoneContactInput = {
  callCountryCode?: string | null;
  callPhone?: string | null;
  whatsappCountryCode?: string | null;
  whatsappPhone?: string | null;
  primaryCallCountryCode?: string | null;
  primaryCallPhone?: string | null;
  primaryWhatsAppCountryCode?: string | null;
  primaryWhatsAppPhone?: string | null;
  primaryMobile?: string | null;
};

export type PhoneContact = {
  display: string;
  e164: string;
  digits: string;
  telHref: string;
  whatsappHref: string;
};

export function normalizeCountryCode(value?: string | null) {
  const trimmedValue = String(value || '').trim();
  if (!trimmedValue) return DEFAULT_COUNTRY_CODE;

  const digits = trimmedValue.replace(/\D/g, '');
  if (!digits) return DEFAULT_COUNTRY_CODE;
  return `+${digits}`;
}

export function normalizePhoneInput(value?: string | null) {
  return String(value || '').trim();
}

export function formatPhoneNumber(countryCode?: string | null, phone?: string | null) {
  const normalizedPhone = normalizePhoneInput(phone);
  if (!normalizedPhone) return '';
  return `${normalizeCountryCode(countryCode)} ${normalizedPhone}`;
}

export function buildPhoneContact(countryCode?: string | null, phone?: string | null): PhoneContact | null {
  const normalizedPhone = normalizePhoneInput(phone);
  const phoneDigits = normalizedPhone.replace(/\D/g, '');
  if (!phoneDigits) return null;

  const countryDigits = normalizeCountryCode(countryCode).replace(/\D/g, '');
  const e164 = `+${countryDigits}${phoneDigits}`;
  const digits = `${countryDigits}${phoneDigits}`;

  return {
    display: formatPhoneNumber(countryCode, normalizedPhone),
    e164,
    digits,
    telHref: `tel:${e164}`,
    whatsappHref: `https://wa.me/${digits}`,
  };
}

export function getMemberCallContact(member: PhoneContactInput, family?: PhoneContactInput) {
  return buildPhoneContact(
    member.callCountryCode || family?.primaryCallCountryCode || DEFAULT_COUNTRY_CODE,
    member.callPhone || family?.primaryCallPhone || null,
  );
}

export function getMemberWhatsAppContact(member: PhoneContactInput, family?: PhoneContactInput) {
  return buildPhoneContact(
    member.whatsappCountryCode || family?.primaryWhatsAppCountryCode || member.callCountryCode || family?.primaryCallCountryCode || DEFAULT_COUNTRY_CODE,
    member.whatsappPhone || family?.primaryWhatsAppPhone || null,
  );
}
