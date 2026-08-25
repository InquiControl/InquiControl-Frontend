import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { PageMetaProvider } from "./context/PageMetaContext";
import SessionWatcher from "./context/SessionWatcher";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Units from "./pages/Units";
import UnitDetail from "./pages/UnitDetail";
import Tenants from "./pages/Tenants";
import TenantDetail from "./pages/TenantDetail";
import Meters from "./pages/Meters";
import Readings from "./pages/Readings";
import MeterReadingsDetail from "./pages/MeterReadingsDetail";
import UtilityBills from "./pages/UtilityBills";
import Charges from "./pages/Charges";
import Payments from "./pages/Payments";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <PageMetaProvider>
            <BrowserRouter>
              <SessionWatcher />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />

                  <Route path="/properties" element={<Properties />} />
                  <Route path="/properties/:propertyId" element={<PropertyDetail />} />

                  <Route path="/units" element={<Units />} />
                  <Route path="/units/:unitId" element={<UnitDetail />} />

                  <Route path="/tenants" element={<Tenants />} />
                  <Route path="/tenants/:tenantId" element={<TenantDetail />} />

                  <Route path="/meters" element={<Meters />} />
                  <Route path="/meters/:meterId/readings" element={<MeterReadingsDetail />} />

                  <Route path="/readings" element={<Readings />} />

                  <Route path="/utility-bills" element={<UtilityBills />} />
                  <Route path="/charges" element={<Charges />} />
                  <Route path="/payments" element={<Payments />} />
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </PageMetaProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
