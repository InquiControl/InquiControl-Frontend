# InquiControl — Frontend

Frontend en React + Vite para InquiControl, con identidad visual propia,
i18n completo (ES/EN) y conexión 100% real al backend (sin datos mock).

## Instalación

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

`.env` apunta por defecto a `http://localhost:3000`.

## Identidad visual

Paleta verde pino + cobre, tipografía serif para títulos y monoespaciada
para cifras, textura de "plano técnico" en el login y el panel principal.
Sidebar colapsable con iconos (lucide-react), drawers para altas rápidas,
diálogos de confirmación propios (no `window.confirm`), toasts de
feedback, skeletons de carga y estados vacíos ilustrados.

## Internacionalización

`react-i18next`, español por defecto, selector ES/EN en el sidebar
(persistido en `localStorage`). Namespaces modulares en
`src/i18n/locales/{es,en}/*.json`. Fechas y montos usan `Intl` según el
idioma activo (`src/utils/format.js`).

## Endpoints reales usados (todos verificados contra el backend)

- Auth: `/api/auth/{register,login,me}`
- Properties: `/api/properties` (+ `:id`)
- Units: `/api/units/property/:propertyId`, `/api/units/:id`
- Tenants: `/api/tenants/unit/:unitId`, `/api/tenants/:id`
- Utility bills: `/api/utility-bills` (+ `:id`)
- Charges: `/api/charges`, `/api/charges/generate/:utilityBillId`
- Payments: `/api/payments` (+ `:id`)
- **Meters**: `/api/meters` (GET/POST/PUT/DELETE) — confirmado en el backend actualizado
- **Meter readings**: `/api/meter-readings`, `/api/meter-readings/meter/:meterId`
  (GET/POST/PUT/DELETE) — el backend calcula `previous_reading` y
  `consumption` y rechaza (400) una lectura menor a la anterior; el
  frontend valida lo mismo del lado del cliente antes de enviar.

## Páginas

Login y Registro (pantalla dividida), Dashboard (saludo, KPIs, estado
financiero, alertas, acciones rápidas), Propiedades (tarjetas +
ocupación), detalle de propiedad (unidades), Unidades (vista agregada +
detalle con inquilinos/medidores/cargos), Inquilinos (vista agregada +
detalle con historial), Medidores, Lecturas (resumen + detalle con
gráfico de consumo y registro validado), Facturas (filtros + desglose +
generación de cargos), Cargos (filtros + detalle) y Pagos (pago único,
monto bloqueado).

## Pendiente / sugerencias

- Code-splitting de `recharts` (el bundle actual pesa ~700kB minificado);
  se puede resolver con `React.lazy` en `MeterReadingsDetail`.
- La foto de lectura es solo un selector local: el backend no expone un
  campo/endpoint de subida de imágenes, así que no se envía todavía.
