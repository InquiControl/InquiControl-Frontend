import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Users, Gauge, Receipt } from "lucide-react";
import { unitsApi, tenantsApi, metersApi, chargesApi } from "../api/endpoints";
import Banner from "../components/Banner";
import Drawer from "../components/Drawer";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import Money from "../components/Money";
import { SkeletonTable } from "../components/Skeleton";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { usePageMeta } from "../context/PageMetaContext";
import { ApiError } from "../api/client";

const EMPTY_FORM = {
  name: "",
  lastname: "",
  dni: "",
  phone: "",
  start_date: "",
  end_date: "",
  status: "ACTIVE"
};

export default function UnitDetail() {
  const { t } = useTranslation();
  const { unitId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();

  const [unit, setUnit] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [meters, setMeters] = useState([]);
  const [pendingCharges, setPendingCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  usePageMeta(
    {
      title: unit?.name || "",
      breadcrumb: [{ label: t("units.title"), to: "/units" }, { label: unit?.name || "" }]
    },
    [unit, t]
  );

  async function load() {
    setLoading(true);
    try {
      const [unitRes, tenantsRes, metersRes] = await Promise.all([
        unitsApi.get(unitId),
        tenantsApi.listByUnit(unitId),
        metersApi.list().catch(() => ({ meters: [] }))
      ]);
      setUnit(unitRes.unit);
      const tenantList = tenantsRes.tenants || [];
      setTenants(tenantList);
      setMeters((metersRes.meters || []).filter((m) => m.unit_id === Number(unitId)));

      if (tenantList.length > 0) {
        const chargesRes = await chargesApi.list();
        const tenantIds = new Set(tenantList.map((tn) => tn.id));
        setPendingCharges(
          (chargesRes.charges || []).filter((c) => c.status === "PENDING" && tenantIds.has(c.tenant_id))
        );
      } else {
        setPendingCharges([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(tenant) {
    setEditingId(tenant.id);
    setForm({
      name: tenant.name,
      lastname: tenant.lastname,
      dni: tenant.dni || "",
      phone: tenant.phone || "",
      start_date: tenant.start_date ? tenant.start_date.substring(0, 10) : "",
      end_date: tenant.end_date ? tenant.end_date.substring(0, 10) : "",
      status: tenant.status || "ACTIVE"
    });
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await tenantsApi.update(editingId, form);
        toast.success(t("common.actions.saveChanges"));
      } else {
        await tenantsApi.create({ ...form, unit_id: Number(unitId) });
        toast.success(t("units.detail.newTenant"));
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tenant) {
    const confirmed = await confirm({ title: t("common.feedback.confirmDeleteTitle") });
    if (!confirmed) return;
    try {
      await tenantsApi.remove(tenant.id);
      toast.success(t("common.actions.delete"));
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>{loading ? "…" : unit?.name}</h1>
          {!loading && <StatusBadge status={unit?.status} />}
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      <div className="two-col">
        <section className="panel">
          <div className="panel__header">
            <h2 className="section-title">
              <Users size={16} /> {t("units.detail.tenantsTitle")}
            </h2>
            <button className="btn btn--primary btn--small" onClick={openCreate}>
              <Plus size={14} /> {t("units.detail.newTenant")}
            </button>
          </div>
          {loading ? (
            <SkeletonTable rows={2} columns={3} />
          ) : tenants.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("units.detail.tenantsEmpty.title")}
              body={t("units.detail.tenantsEmpty.body")}
              actionLabel={t("units.detail.tenantsEmpty.cta")}
              onAction={openCreate}
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("tenants.columns.name")}</th>
                    <th>{t("tenants.columns.status")}</th>
                    <th aria-label="acciones"></th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td data-label={t("tenants.columns.name")}>
                        <button
                          className="link-button"
                          style={{ margin: 0 }}
                          onClick={() => navigate(`/tenants/${tenant.id}`)}
                        >
                          {tenant.name} {tenant.lastname}
                        </button>
                      </td>
                      <td data-label={t("tenants.columns.status")}>
                        <StatusBadge status={tenant.status} />
                      </td>
                      <td className="table__actions">
                        <button className="icon-btn" onClick={() => openEdit(tenant)} aria-label="edit">
                          <Pencil size={15} />
                        </button>
                        <button className="icon-btn" onClick={() => handleDelete(tenant)} aria-label="delete">
                          <Trash2 size={15} />
                        </button>
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
            <h2 className="section-title">
              <Gauge size={16} /> {t("units.detail.metersTitle")}
            </h2>
          </div>
          {loading ? (
            <SkeletonTable rows={2} columns={2} />
          ) : meters.length === 0 ? (
            <p className="muted">{t("units.detail.metersEmpty")}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("meters.columns.code")}</th>
                    <th>{t("meters.columns.type")}</th>
                  </tr>
                </thead>
                <tbody>
                  {meters.map((meter) => (
                    <tr
                      key={meter.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/meters/${meter.id}/readings`)}
                    >
                      <td data-label={t("meters.columns.code")}>
                        <span className="link">{meter.code}</span>
                      </td>
                      <td data-label={t("meters.columns.type")}>
                        {t(`common.serviceType.${meter.type}`, { defaultValue: meter.type })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h2 className="section-title">
            <Receipt size={16} /> {t("units.detail.chargesTitle")}
          </h2>
        </div>
        {loading ? (
          <SkeletonTable rows={2} columns={3} />
        ) : pendingCharges.length === 0 ? (
          <p className="muted">{t("units.detail.chargesEmpty")}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("charges.columns.amount")}</th>
                  <th>{t("charges.columns.status")}</th>
                </tr>
              </thead>
              <tbody>
                {pendingCharges.map((charge) => (
                  <tr key={charge.id}>
                    <td data-label="#">{charge.id}</td>
                    <td data-label={t("charges.columns.amount")}>
                      <Money value={charge.amount} />
                    </td>
                    <td data-label={t("charges.columns.status")}>
                      <StatusBadge status={charge.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? t("common.actions.edit") : t("units.detail.newTenant")}
      >
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>{t("tenants.form.name")}</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field">
            <span>{t("tenants.form.lastname")}</span>
            <input
              value={form.lastname}
              onChange={(e) => setForm({ ...form, lastname: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>{t("tenants.form.dni")}</span>
            <input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
          </label>
          <label className="field">
            <span>{t("tenants.form.phone")}</span>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="field">
            <span>{t("tenants.form.startDate")}</span>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>{t("tenants.form.endDate")}</span>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </label>
          {editingId && (
            <label className="field">
              <span>{t("tenants.form.status")}</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">{t("common.status.ACTIVE")}</option>
                <option value="INACTIVE">{t("common.status.INACTIVE")}</option>
              </select>
            </label>
          )}
          <div className="form__actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? t("common.feedback.saving") : editingId ? t("common.actions.saveChanges") : t("common.actions.create")}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
