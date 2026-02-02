export const Roles: {
  [key: string]: 'admin' | 'monter' | 'klient';
} = {
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

  // Zadania
  viewTasks,

  // Szkolenia
  viewTrainings,
  addTrainings,

  // Faktury
  viewInvoices,
  addInvoices,

  // Czat
  chat,
}

export const Permissions: {
  [key: keyof typeof Roles]: Scopes[];
} = {
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
    Scopes.viewTasks,
    Scopes.viewTrainings,
    Scopes.addTrainings,
    Scopes.viewInvoices,
    Scopes.addInvoices,
    Scopes.chat,
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
  ],
  [Roles.client]: [Scopes.viewInvoices, Scopes.viewOffers, Scopes.viewCatalogs, Scopes.chat],
};
