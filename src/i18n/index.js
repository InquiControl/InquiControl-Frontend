import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import esCommon from "./locales/es/common.json";
import esAuth from "./locales/es/auth.json";
import esDashboard from "./locales/es/dashboard.json";
import esProperties from "./locales/es/properties.json";
import esUnits from "./locales/es/units.json";
import esTenants from "./locales/es/tenants.json";
import esMeters from "./locales/es/meters.json";
import esReadings from "./locales/es/readings.json";
import esUtilityBills from "./locales/es/utilityBills.json";
import esCharges from "./locales/es/charges.json";
import esPayments from "./locales/es/payments.json";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enDashboard from "./locales/en/dashboard.json";
import enProperties from "./locales/en/properties.json";
import enUnits from "./locales/en/units.json";
import enTenants from "./locales/en/tenants.json";
import enMeters from "./locales/en/meters.json";
import enReadings from "./locales/en/readings.json";
import enUtilityBills from "./locales/en/utilityBills.json";
import enCharges from "./locales/en/charges.json";
import enPayments from "./locales/en/payments.json";

export const LANGUAGE_STORAGE_KEY = "inquicontrol_lang";

const resources = {
  es: {
    translation: {
      common: esCommon,
      auth: esAuth,
      dashboard: esDashboard,
      properties: esProperties,
      units: esUnits,
      tenants: esTenants,
      meters: esMeters,
      readings: esReadings,
      utilityBills: esUtilityBills,
      charges: esCharges,
      payments: esPayments
    }
  },
  en: {
    translation: {
      common: enCommon,
      auth: enAuth,
      dashboard: enDashboard,
      properties: enProperties,
      units: enUnits,
      tenants: enTenants,
      meters: enMeters,
      readings: enReadings,
      utilityBills: enUtilityBills,
      charges: enCharges,
      payments: enPayments
    }
  }
};

const savedLanguage = typeof window !== "undefined" ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage || "es",
  fallbackLng: "es",
  interpolation: {
    escapeValue: false
  },
  returnEmptyString: false
});

export function changeLanguage(lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export default i18n;
