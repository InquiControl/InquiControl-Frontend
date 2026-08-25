import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DoorOpen } from "lucide-react";
import { fetchAllTenants } from "../utils/aggregate";
import { chargesApi } from "../api/endpoints";
import Banner from "../components/Banner";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { SkeletonTable } from "../components/Skeleton";
import { usePageMeta } from "../context/PageMetaContext";
import { ApiError } from "../api/client";

export default function Units() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  usePageMeta({ title: t("units.title") }, [t]);

  const [units, setUnits] = useState([]);
  const [tenantsByUnit, setTenantsByUnit] = useState({});
  const [pendingByUnit, setPendingByUnit] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [{ units: allUnits, tenants }, chargesRes] = await Promise.all([
          fetchAllTenants(),
          chargesApi.list()
        ]);

        const tenantMap = {};
        tenants.forEach((tenant) => {
          tenantMap[tenant.unit.id] = tenantMap[tenant.unit.id] || [];
          tenantMap[tenant.unit.id].push(tenant);
        });

        const tenantIdToUnitId = {};
        tenants.forEach((tenant) => {
          tenantIdToUnitId[tenant.id] = tenant.unit.id;
        });

        const pendingMap = {};
        (chargesRes.charges || [])
          .filter((c) => c.status === "PENDING")
          .forEach((c) => {
            const unitId = tenantIdToUnitId[c.tenant_id];
            if (!unitId) return;
            pendingMap[unitId] = (pendingMap[unitId] || 0) + Number(c.amount || 0);
          });

        setUnits(allUnits);
        setTenantsByUnit(tenantMap);
        setPendingByUnit(pendingMap);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>{t("units.title")}</h1>
          <p className="page__subtitle">{t("units.subtitle")}</p>
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      <section className="panel">
        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : units.length === 0 ? (
          <EmptyState icon={DoorOpen} title={t("units.empty.title")} body={t("units.empty.body")} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("units.columns.unit")}</th>
                  <th>{t("units.columns.property")}</th>
                  <th>{t("units.columns.status")}</th>
                  <th>{t("units.columns.tenant")}</th>
                  <th>{t("units.columns.pendingCharges")}</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => {
                  const tenantsHere = tenantsByUnit[unit.id] || [];
                  const activeTenant = tenantsHere.find((tn) => tn.status === "ACTIVE") || tenantsHere[0];
                  return (
                    <tr key={unit.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/units/${unit.id}`)}>
                      <td data-label={t("units.columns.unit")}>
                        <span className="link">{unit.name}</span>
                      </td>
                      <td data-label={t("units.columns.property")}>{unit.property.name}</td>
                      <td data-label={t("units.columns.status")}>
                        <StatusBadge status={unit.status} />
                      </td>
                      <td data-label={t("units.columns.tenant")}>
                        {activeTenant ? `${activeTenant.name} ${activeTenant.lastname}` : t("units.noTenant")}
                      </td>
                      <td data-label={t("units.columns.pendingCharges")}>
                        {pendingByUnit[unit.id] ? pendingByUnit[unit.id].toFixed(2) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
