import { propertiesApi, unitsApi, tenantsApi } from "../api/endpoints";

/**
 * Trae todas las propiedades y, para cada una, sus unidades
 * (el backend solo expone unidades por propiedad).
 */
export async function fetchPropertiesWithUnits() {
  const { properties = [] } = await propertiesApi.list();
  const withUnits = await Promise.all(
    properties.map(async (property) => {
      const { units = [] } = await unitsApi.listByProperty(property.id);
      return { ...property, units };
    })
  );
  return withUnits;
}

/** Aplana todas las unidades de todas las propiedades, con la propiedad adjunta. */
export async function fetchAllUnits() {
  const properties = await fetchPropertiesWithUnits();
  const units = [];
  for (const property of properties) {
    for (const unit of property.units) {
      units.push({ ...unit, property: { id: property.id, name: property.name } });
    }
  }
  return { units, properties };
}

/** Trae todos los inquilinos de todas las unidades, con unidad y propiedad adjuntas. */
export async function fetchAllTenants() {
  const { units, properties } = await fetchAllUnits();
  const tenantLists = await Promise.all(
    units.map(async (unit) => {
      const { tenants = [] } = await tenantsApi.listByUnit(unit.id);
      return tenants.map((tenant) => ({ ...tenant, unit }));
    })
  );
  return { tenants: tenantLists.flat(), units, properties };
}
