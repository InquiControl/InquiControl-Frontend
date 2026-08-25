import { apiFetch } from "./client";

// ============ AUTH ============
// POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
export const authApi = {
  login: (email, password) =>
    apiFetch("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),
  register: (name, email, password) =>
    apiFetch("/api/auth/register", { method: "POST", body: { name, email, password }, auth: false }),
  me: () => apiFetch("/api/auth/me")
};

// ============ PROPERTIES ============
// POST /, GET /, GET /:id, PUT /:id, DELETE /:id
export const propertiesApi = {
  list: () => apiFetch("/api/properties"),
  get: (id) => apiFetch(`/api/properties/${id}`),
  create: (payload) => apiFetch("/api/properties", { method: "POST", body: payload }),
  update: (id, payload) => apiFetch(`/api/properties/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiFetch(`/api/properties/${id}`, { method: "DELETE" })
};

// ============ UNITS ============
// POST /, GET /property/:propertyId, GET /:id, PUT /:id, DELETE /:id
export const unitsApi = {
  listByProperty: (propertyId) => apiFetch(`/api/units/property/${propertyId}`),
  get: (id) => apiFetch(`/api/units/${id}`),
  create: (payload) => apiFetch("/api/units", { method: "POST", body: payload }),
  update: (id, payload) => apiFetch(`/api/units/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiFetch(`/api/units/${id}`, { method: "DELETE" })
};

// ============ TENANTS ============
// POST /, GET /unit/:unitId, GET /:id, PUT /:id, DELETE /:id
export const tenantsApi = {
  listByUnit: (unitId) => apiFetch(`/api/tenants/unit/${unitId}`),
  get: (id) => apiFetch(`/api/tenants/${id}`),
  create: (payload) => apiFetch("/api/tenants", { method: "POST", body: payload }),
  update: (id, payload) => apiFetch(`/api/tenants/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiFetch(`/api/tenants/${id}`, { method: "DELETE" })
};

// ============ UTILITY BILLS ============
// POST /, GET /, GET /:id
export const utilityBillsApi = {
  list: () => apiFetch("/api/utility-bills"),
  get: (id) => apiFetch(`/api/utility-bills/${id}`),
  create: (payload) => apiFetch("/api/utility-bills", { method: "POST", body: payload })
};

// ============ CHARGES ============
// POST /generate/:utilityBillId, GET /, GET /:id
export const chargesApi = {
  list: () => apiFetch("/api/charges"),
  get: (id) => apiFetch(`/api/charges/${id}`),
  generate: (utilityBillId) =>
    apiFetch(`/api/charges/generate/${utilityBillId}`, { method: "POST" })
};

// ============ METERS ============
// GET /, GET /:id, POST /, PUT /:id, DELETE /:id
// Confirmado contra backend/src/{routes,controllers,services}/meter*.js
export const metersApi = {
  list: () => apiFetch("/api/meters"),
  get: (id) => apiFetch(`/api/meters/${id}`),
  create: (payload) => apiFetch("/api/meters", { method: "POST", body: payload }),
  update: (id, payload) => apiFetch(`/api/meters/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiFetch(`/api/meters/${id}`, { method: "DELETE" })
};

// ============ METER READINGS ============
// GET /, GET /:id, GET /meter/:meterId, POST /, PUT /:id, DELETE /:id
// El backend calcula previous_reading y consumption al crear/actualizar,
// y rechaza con 400 una lectura menor que la anterior del mismo medidor.
export const meterReadingsApi = {
  list: () => apiFetch("/api/meter-readings"),
  get: (id) => apiFetch(`/api/meter-readings/${id}`),
  listByMeter: (meterId) => apiFetch(`/api/meter-readings/meter/${meterId}`),
  create: (payload) => apiFetch("/api/meter-readings", { method: "POST", body: payload }),
  update: (id, payload) => apiFetch(`/api/meter-readings/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiFetch(`/api/meter-readings/${id}`, { method: "DELETE" })
};

// ============ PAYMENTS ============
// POST /, GET /, GET /:id
export const paymentsApi = {
  list: () => apiFetch("/api/payments"),
  get: (id) => apiFetch(`/api/payments/${id}`),
  create: (payload) => apiFetch("/api/payments", { method: "POST", body: payload })
};
