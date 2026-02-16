export const Roles: {
  [key: string]: 'global_admin' | 'admin' | 'monter' | 'klient';
} = {
  globalAdmin: 'global_admin',
  admin: 'admin',
  assembler: 'monter',
  client: 'klient',
};
export const enum Scopes {
  staff, // Ekipy i pracownicy
  discounts, // Narzuty i rabaty
  texts, // Szablony tekstów
  clients, // Klienci
  map, // Mapa
  gallery, // Galeria

  // Katalogi
  viewCatalogs,
  addCatalogs,

  // Oferty
  viewOffers,
  addOffers,
  offers, // Ustawienia ofert

  // Zadania
  viewTasks,

  // Szkolenia
  viewTrainings,
  addTrainings,

  // Faktury
  viewInvoices,
  addInvoices,
  invoices, // Ustawienia faktur

  // Czat
  chat,

  // Dokumentacja
  viewDocumentation, // Podgląd dokumentacji
  manageDocumentation, // Zarządzanie dokumentacją (tylko global_admin)

  // Galeria urządzeń
  manageDeviceGallery, // Zarządzanie galerią urządzeń (tylko global_admin)
}

export const Permissions: {
  [key: keyof typeof Roles]: Scopes[];
} = {
  [Roles.globalAdmin]: [
    Scopes.staff,
    Scopes.discounts,
    Scopes.texts,
    Scopes.clients,
    Scopes.map,
    Scopes.gallery,
    Scopes.viewCatalogs,
    Scopes.addCatalogs,
    Scopes.viewOffers,
    Scopes.addOffers,
    Scopes.offers,
    Scopes.viewTasks,
    Scopes.viewTrainings,
    Scopes.addTrainings,
    Scopes.viewInvoices,
    Scopes.addInvoices,
    Scopes.invoices,
    Scopes.chat,
    Scopes.viewDocumentation,
    Scopes.manageDocumentation,
    Scopes.manageDeviceGallery,
  ],
  [Roles.admin]: [
    Scopes.staff,
    Scopes.discounts,
    Scopes.texts,
    Scopes.clients,
    Scopes.map,
    Scopes.gallery,
    Scopes.viewCatalogs,
    Scopes.addCatalogs,
    Scopes.viewOffers,
    Scopes.addOffers,
    Scopes.offers,
    Scopes.viewTasks,
    Scopes.viewTrainings,
    Scopes.addTrainings,
    Scopes.viewInvoices,
    Scopes.addInvoices,
    Scopes.invoices,
    Scopes.chat,
    Scopes.viewDocumentation,
  ],
  [Roles.assembler]: [
    Scopes.clients,
    Scopes.map,
    Scopes.gallery,
    Scopes.viewCatalogs,
    Scopes.addCatalogs,
    Scopes.viewOffers,
    Scopes.addOffers,
    Scopes.viewTasks,
    Scopes.viewTrainings,
    Scopes.viewInvoices,
    Scopes.addInvoices,
    Scopes.chat,
    Scopes.discounts,
    Scopes.viewDocumentation,
  ],
  [Roles.client]: [
    Scopes.viewInvoices,
    Scopes.viewOffers,
    Scopes.viewCatalogs,
    Scopes.chat,
    Scopes.viewDocumentation,
  ],
};
