import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, DoorOpen, Users, Wallet } from "lucide-react";
import { propertiesApi, unitsApi, tenantsApi, chargesApi } from "../api/endpoints";
import Banner from "../components/Banner";
import Drawer from "../components/Drawer";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { SkeletonTable } from "../components/Skeleton";
import Money, { formatMoney } from "../components/Money";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { usePageMeta } from "../context/PageMetaContext";
import { ApiError } from "../api/client";

const EMPTY_FORM = { name: "", status: "AVAILABLE" };

export default function PropertyDetail() {
  const { t, i18n } = useTranslation();
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();

  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [tenantCount, setTenantCount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  usePageMeta(
    {
      title: property?.name || "",
      breadcrumb: [{ label: t("properties.title"), to: "/properties" }, { label: property?.name || "" }]
    },
    [property, t]
  );

  async function load() {
    setLoading(true);
    try {
      const [propertyRes, unitsRes] = await Promise.all([
        propertiesApi.get(propertyId),
        unitsApi.listByProperty(propertyId)
      ]);
      const unitList = unitsRes.units || [];
      setProperty(propertyRes.property);
      setUnits(unitList);

      const [tenantsPerUnit, chargesRes] = await Promise.all([
        Promise.all(unitList.map((u) => tenantsApi.listByUnit(u.id))),
        chargesApi.list()
      ]);
      const totalTenants = tenantsPerUnit.reduce((sum, r) => sum + (r.tenants?.length || 0), 0);
      setTenantCount(totalTenants);

      const tenantIdsInProperty = new Set(
        tenantsPerUnit.flatMap((r) => (r.tenants || []).map((tn) => tn.id))
      );
      const pending = (chargesRes.charges || [])
        .filter((c) => c.status === "PENDING" && tenantIdsInProperty.has(c.tenant_id))
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);
      setPendingAmount(pending);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(unit) {
    setEditingId(unit.id);
    setForm({ name: unit.name, status: unit.status || "AVAILABLE" });
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await unitsApi.update(editingId, form);
        toast.success(t("common.actions.saveChanges"));
      } else {
        await unitsApi.create({ ...form, property_id: Number(propertyId) });
        toast.success(t("properties.detail.newUnit"));
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(unit) {
    const confirmed = await confirm({ title: t("common.feedback.confirmDeleteTitle") });
    if (!confirmed) return;
    try {
      await unitsApi.remove(unit.id);
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
          <h1>{loading ? "…" : property?.name}</h1>
          <p className="page__subtitle">{property?.address}</p>
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      {!loading && (
        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="stat-card">
            <div className="stat-card__top">
              <span className="stat-card__label">{t("properties.detail.summary.units")}</span>
              <DoorOpen size={16} className="stat-card__icon" />
            </div>
            <div className="stat-card__value">{units.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__top">
              <span className="stat-card__label">{t("properties.detail.summary.tenants")}</span>
              <Users size={16} className="stat-card__icon" />
            </div>
            <div className="stat-card__value">{tenantCount}</div>
          </div>
          <div className="stat-card stat-card--pending">
            <div className="stat-card__top">
              <span className="stat-card__label">{t("properties.detail.summary.pendingAmount")}</span>
              <Wallet size={16} className="stat-card__icon" />
            </div>
            <div className="stat-card__value">{formatMoney(pendingAmount, i18n.language)}</div>
          </div>
        </div>
      )}

      <section className="panel">
        <div className="panel__header">
          <h2>{t("properties.detail.unitsTitle")}</h2>
          <button className="btn btn--primary btn--small" onClick={openCreate}>
            <Plus size={14} /> {t("properties.detail.newUnit")}
          </button>
        </div>

        {loading ? (
          <SkeletonTable rows={3} columns={3} />
        ) : units.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title={t("properties.detail.unitsEmpty.title")}
            body={t("properties.detail.unitsEmpty.body")}
            actionLabel={t("properties.detail.unitsEmpty.cta")}
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("units.columns.unit")}</th>
                  <th>{t("units.columns.status")}</th>
                  <th aria-label="acciones"></th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td data-label={t("units.columns.unit")}>
                      <button className="link-button" style={{ margin: 0 }} onClick={() => navigate(`/units/${unit.id}`)}>
                        {unit.name}
                      </button>
                    </td>
                    <td data-label={t("units.columns.status")}>
                      <StatusBadge status={unit.status} />
                    </td>
                    <td className="table__actions">
                      <button className="icon-btn" onClick={() => openEdit(unit)} aria-label="edit">
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn" onClick={() => handleDelete(unit)} aria-label="delete">
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

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? t("common.actions.edit") : t("properties.detail.newUnit")}
      >
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>{t("properties.unitForm.name")}</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("properties.unitForm.namePlaceholder")}
              required
            />
          </label>
          <label className="field">
            <span>{t("properties.unitForm.status")}</span>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="AVAILABLE">{t("common.status.AVAILABLE")}</option>
              <option value="OCCUPIED">{t("common.status.OCCUPIED")}</option>
            </select>
          </label>
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
