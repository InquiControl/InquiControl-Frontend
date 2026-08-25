import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2,
  DoorOpen,
  Users,
  Wallet,
  Plus,
  Gauge,
  Receipt,
  Wallet2,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { propertiesApi, utilityBillsApi, chargesApi, paymentsApi } from "../api/endpoints";
import { fetchAllUnits, fetchAllTenants } from "../utils/aggregate";
import { formatMoney } from "../components/Money";
import { formatDate } from "../utils/format";
import Banner from "../components/Banner";
import EmptyState from "../components/EmptyState";
import { SkeletonStatGrid, SkeletonTable } from "../components/Skeleton";
import { ApiError } from "../api/client";

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 19) return "afternoon";
  return "evening";
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [bills, setBills] = useState([]);
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [propertiesRes, unitsData, tenantsData, billsRes, chargesRes, paymentsRes] =
          await Promise.all([
            propertiesApi.list(),
            fetchAllUnits(),
            fetchAllTenants(),
            utilityBillsApi.list(),
            chargesApi.list(),
            paymentsApi.list()
          ]);
        setProperties(propertiesRes.properties || []);
        setUnits(unitsData.units);
        setTenants(tenantsData.tenants);
        setBills(billsRes.utility_bills || []);
        setCharges(chargesRes.charges || []);
        setPayments(paymentsRes.payments || []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  const occupiedUnits = units.filter((u) => u.status === "OCCUPIED").length;
  const availableUnits = units.filter((u) => u.status !== "OCCUPIED").length;
  const activeTenants = tenants.filter((tn) => tn.status === "ACTIVE").length;

  const pendingCharges = charges.filter((c) => c.status === "PENDING");
  const pendingTotal = pendingCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const paidTotal = charges
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const billsDueSoon = useMemo(() => {
    const now = Date.now();
    const in7days = now + 7 * 24 * 60 * 60 * 1000;
    return bills.filter((b) => {
      if (!b.due_date) return false;
      const due = new Date(b.due_date).getTime();
      return due >= now && due <= in7days;
    });
  }, [bills]);

  const recentBills = [...bills]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.payment_date || 0) - new Date(a.payment_date || 0))
    .slice(0, 5);

  const user = JSON.parse(
    localStorage.getItem("inquicontrol_user") || sessionStorage.getItem("inquicontrol_user") || "null"
  );
  const firstName = (user?.name || "").split(" ")[0];

  const hasAlerts = billsDueSoon.length > 0 || pendingCharges.length > 0;

  return (
    <div className="page">
      <div className="hero blueprint-texture">
        <div className="hero__content">
          <h1>{t(`dashboard.greeting.${greetingKey()}`, { name: firstName })}</h1>
          <p>{t("dashboard.subtitle")}</p>
        </div>
      </div>

      <Banner kind="error">{error}</Banner>

      {loading ? (
        <SkeletonStatGrid count={4} />
      ) : (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-card__top">
              <span className="stat-card__label">{t("dashboard.kpis.properties")}</span>
              <Building2 size={16} className="stat-card__icon" />
            </div>
            <div className="stat-card__value">{properties.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__top">
              <span className="stat-card__label">{t("dashboard.kpis.occupiedUnits")}</span>
              <DoorOpen size={16} className="stat-card__icon" />
            </div>
            <div className="stat-card__value">{occupiedUnits}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__top">
              <span className="stat-card__label">{t("dashboard.kpis.availableUnits")}</span>
              <DoorOpen size={16} className="stat-card__icon" />
            </div>
            <div className="stat-card__value">{availableUnits}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__top">
              <span className="stat-card__label">{t("dashboard.kpis.activeTenants")}</span>
              <Users size={16} className="stat-card__icon" />
            </div>
            <div className="stat-card__value">{activeTenants}</div>
          </div>
        </div>
      )}

      <section className="panel">
        <div className="panel__header">
          <h2>{t("dashboard.quickActions.title")}</h2>
        </div>
        <div className="filter-bar">
          <button className="btn btn--primary btn--small" onClick={() => navigate("/properties")}>
            <Plus size={14} /> {t("dashboard.quickActions.newProperty")}
          </button>
          <button className="btn btn--small" onClick={() => navigate("/readings")}>
            <Gauge size={14} /> {t("dashboard.quickActions.registerReading")}
          </button>
          <button className="btn btn--small" onClick={() => navigate("/utility-bills")}>
            <Receipt size={14} /> {t("dashboard.quickActions.registerBill")}
          </button>
          <button className="btn btn--small" onClick={() => navigate("/payments")}>
            <Wallet2 size={14} /> {t("dashboard.quickActions.registerPayment")}
          </button>
        </div>
      </section>

      {!loading && (
        <section className="panel">
          <div className="panel__header">
            <h2>{t("dashboard.financial.title")}</h2>
          </div>
          <div className="stat-grid">
            <div className="stat-card stat-card--pending">
              <div className="stat-card__label">{t("dashboard.financial.totalPending")}</div>
              <div className="stat-card__value">{formatMoney(pendingTotal, i18n.language)}</div>
              <div className="stat-card__hint">
                {pendingCharges.length} {t("dashboard.financial.pendingBills")}
              </div>
            </div>
            <div className="stat-card stat-card--success">
              <div className="stat-card__label">{t("dashboard.financial.totalCollected")}</div>
              <div className="stat-card__value">{formatMoney(paidTotal, i18n.language)}</div>
            </div>
          </div>
        </section>
      )}

      <div className="two-col">
        <section className="panel">
          <div className="panel__header">
            <h2>{t("dashboard.services.recentBills")}</h2>
            <button className="link-button" onClick={() => navigate("/utility-bills")}>
              {t("common.actions.seeAll")}
            </button>
          </div>
          {loading ? (
            <SkeletonTable rows={3} columns={4} />
          ) : recentBills.length === 0 ? (
            <EmptyState icon={Receipt} title={t("dashboard.services.noBills")} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("dashboard.recentBillsTable.period")}</th>
                    <th>{t("dashboard.recentBillsTable.service")}</th>
                    <th>{t("dashboard.recentBillsTable.consumption")}</th>
                    <th>{t("dashboard.recentBillsTable.amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBills.map((bill) => (
                    <tr key={bill.id}>
                      <td data-label={t("dashboard.recentBillsTable.period")}>{bill.period}</td>
                      <td data-label={t("dashboard.recentBillsTable.service")}>
                        {t(`common.serviceType.${bill.type}`, { defaultValue: bill.type })}
                      </td>
                      <td data-label={t("dashboard.recentBillsTable.consumption")}>{bill.consumption}</td>
                      <td data-label={t("dashboard.recentBillsTable.amount")} className="money">
                        {formatMoney(bill.total_amount, i18n.language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2>{t("dashboard.financial.recentPayments")}</h2>
            <button className="link-button" onClick={() => navigate("/payments")}>
              {t("common.actions.seeAll")}
            </button>
          </div>
          {loading ? (
            <SkeletonTable rows={3} columns={3} />
          ) : recentPayments.length === 0 ? (
            <EmptyState icon={Wallet} title={t("payments.empty.title")} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("dashboard.recentPaymentsTable.date")}</th>
                    <th>{t("dashboard.recentPaymentsTable.charge")}</th>
                    <th>{t("dashboard.recentPaymentsTable.amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td data-label={t("dashboard.recentPaymentsTable.date")}>
                        {formatDate(payment.payment_date, i18n.language)}
                      </td>
                      <td data-label={t("dashboard.recentPaymentsTable.charge")}>#{payment.charge_id}</td>
                      <td data-label={t("dashboard.recentPaymentsTable.amount")} className="money">
                        {formatMoney(payment.amount, i18n.language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {!loading && (
        <section className="panel">
          <div className="panel__header">
            <h2>{t("dashboard.alerts.title")}</h2>
          </div>
          {!hasAlerts ? (
            <div className="banner banner--success" style={{ display: "inline-flex" }}>
              <CheckCircle2 size={16} />
              {t("dashboard.alerts.noAlerts")}
            </div>
          ) : (
            <div className="form" style={{ gap: 10 }}>
              {billsDueSoon.length > 0 && (
                <div className="banner banner--info">
                  <AlertTriangle size={16} />
                  {t("dashboard.alerts.billsDueSoon", { count: billsDueSoon.length })}
                </div>
              )}
              {pendingCharges.length > 0 && (
                <div className="banner banner--error">
                  <AlertTriangle size={16} />
                  {t("dashboard.alerts.pendingCharges", { count: pendingCharges.length })}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
