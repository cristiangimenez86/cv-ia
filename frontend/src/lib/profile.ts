/**
 * Profile-derived helpers shared by `ProfileCard` and `ContactSection`.
 */

/** Builds a `https://wa.me/<digits>` URL from an internationally-formatted phone string. */
export function getWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

/** Builds a `tel:` href from a possibly-spaced phone string. */
export function getTelHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}
