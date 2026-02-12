/**
 * Jednolita zasada wyświetlania klienta na listach:
 * - Dla typu "firma": główna linia = nazwa firmy, druga linia = nazwisko i imię osoby kontaktowej.
 * - Dla osoby prywatnej: główna linia = nazwisko i imię (Nazwisko Imię), druga linia = nazwa firmy / NIP (jeśli jest).
 */

export type ClientLike = {
  first_name: string;
  last_name: string;
  nazwa_firmy?: string | null;
  nip?: string | null;
  rodzaj_klienta?: string | null;
};

function capitalize(str: string): string {
  if (!str?.trim()) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Imię i nazwisko (kolejność: Imię Nazwisko). */
export function formatFirstNameLast(client: ClientLike): string {
  const f = capitalize((client.first_name ?? '').trim());
  const l = capitalize((client.last_name ?? '').trim());
  return `${f} ${l}`.trim();
}

/** Nazwisko i imię (kolejność: Nazwisko Imię) – używane wszędzie na listach. */
export function formatLastNameFirst(client: ClientLike): string {
  const l = capitalize((client.last_name ?? '').trim());
  const f = capitalize((client.first_name ?? '').trim());
  return `${l} ${f}`.trim();
}

export function isCompanyClient(client: ClientLike): boolean {
  return client.rodzaj_klienta === 'firma';
}

/** Główna linia do wyświetlenia (nagłówek / tytuł wiersza). Dla osoby prywatnej: Nazwisko Imię. */
export function getClientDisplayPrimary(client: ClientLike): string {
  const contactNameLastFirst = formatLastNameFirst(client);
  const companyName = (client.nazwa_firmy ?? '').trim();
  const nip = (client.nip ?? '').trim();

  if (isCompanyClient(client)) {
    return (
      companyName ||
      contactNameLastFirst ||
      (nip ? `NIP: ${nip}` : '') ||
      'Klient'
    );
  }
  return (
    contactNameLastFirst ||
    companyName ||
    (nip ? `NIP: ${nip}` : '') ||
    'Klient'
  );
}

/** Druga linia (subtitle) – null jeśli nie ma czego pokazać. */
export function getClientDisplaySecondary(client: ClientLike): string | null {
  const contactNameReverse = formatLastNameFirst(client);
  const companyName = (client.nazwa_firmy ?? '').trim();
  const nip = (client.nip ?? '').trim();

  if (isCompanyClient(client)) {
    return contactNameReverse || null;
  }
  if (companyName || nip) {
    return companyName || (nip ? `NIP: ${nip}` : null) || null;
  }
  return null;
}
