import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Gauge, Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { metersApi } from "../api/endpoints";
import { fetchPropertiesWithUnits } from "../utils/aggregate";
import Banner from "../components/Banner";
import Drawer from "../components/Drawer";
import EmptyState from "../components/EmptyState";
import { SkeletonTable } from "../components/Skeleton";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { usePageMeta } from "../context/PageMetaContext";
import { ApiError } from "../api/client";

const EMPTY_FORM = {
  property_id: "",
  unit_id: "",
  type: "ELECTRICITY",
  code: "",
  measurement_unit: "kWh",
  is_shared: true,
  provider: ""
};

export default function Meters() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  usePageMeta({ title: t("meters.title") }, [t]);

  const [meters, setMeters] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [metersRes, propertiesWithUnits] = await Promise.all([
        metersApi.list(),
        fetchPropertiesWithUnits()
      ]);
      setMeters(metersRes.meters || []);
      setProperties(propertiesWithUnits);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function propertyName(id) {
    return properties.find((p) => p.id === id)?.name || `#${id}`;
  }

  function unitName(propertyId, unitId) {
    if (!unitId) return null;
    const property = properties.find((p) => p.id === propertyId);
    return property?.units.find((u) => u.id === unitId)?.name || `#${unitId}`;
  }

  const unitsForSelectedProperty =
    properties.find((p) => p.id === Number(form.property_id))?.units || [];

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(meter) {
    setEditingId(meter.id);
    setForm({
      property_id: String(meter.property_id),
      unit_id: meter.unit_id ? String(meter.unit_id) : "",
      type: meter.type,
      code: meter.code,
      measurement_unit: meter.measurement_unit,
      is_shared: !!meter.is_shared,
      provider: meter.provider || ""
    });
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      property_id: Number(form.property_id),
      unit_id: form.unit_id ? Number(form.unit_id) : null,
      type: form.type,
      code: form.code,
      measurement_unit: form.measurement_unit,
      is_shared: form.is_shared,
      provider: form.provider || null
    };
    try {
      if (editingId) {
        await metersApi.update(editingId, payload);
        toast.success(t("common.actions.saveChanges"));
      } else {
        await metersApi.create(payload);
        toast.success(t("common.actions.create"));
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(meter) {
    const confirmed = await confirm({ title: t("common.feedback.confirmDeleteTitle") });
    if (!confirmed) return;
    try {
      await metersApi.remove(meter.id);
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
          <h1>{t("meters.title")}</h1>
          <p className="page__subtitle">{t("meters.subtitle")}</p>
        </div>
        <div className="page__header-actions">
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={15} /> {t("common.actions.create")}
          </button>
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      <section className="panel">
        {loading ? (
          <SkeletonTable rows={4} columns={6} />
        ) : meters.length === 0 ? (
          <EmptyState icon={Gauge} title={t("meters.empty.title")} body={t("meters.empty.body")} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("meters.columns.code")}</th>
                  <th>{t("meters.columns.type")}</th>
                  <th>{t("meters.columns.provider")}</th>
                  <th>{t("meters.columns.property")}</th>
                  <th>{t("meters.columns.location")}</th>
                  <th>{t("meters.columns.mode")}</th>
                  <th aria-label="acciones"></th>
                </tr>
              </thead>
              <tbody>
                {meters.map((meter) => (
                  <tr key={meter.id}>
                    <td data-label={t("meters.columns.code")}>{meter.code}</td>
                    <td data-label={t("meters.columns.type")}>
                      {t(`common.serviceType.${meter.type}`, { defaultValue: meter.type })}
                    </td>
                    <td data-label={t("meters.columns.provider")}>{meter.provider || "—"}</td>
                    <td data-label={t("meters.columns.property")}>{propertyName(meter.property_id)}</td>
                    <td data-label={t("meters.columns.location")}>
                      {unitName(meter.property_id, meter.unit_id) || t("meters.generalLocation")}
                    </td>
                    <td data-label={t("meters.columns.mode")}>
                      <span className={`badge badge--${meter.is_shared ? "shared" : "individual"}`}>
                        {t(`common.meterMode.${meter.is_shared ? "shared" : "individual"}`)}
                      </span>
                    </td>
                    <td className="table__actions">
                      <button
                        className="btn btn--small"
                        onClick={() => navigate(`/meters/${meter.id}/readings`)}
                      >
                        {t("meters.viewReadings")} <ArrowRight size={12} />
                      </button>
                      <button className="icon-btn" onClick={() => openEdit(meter)} aria-label="edit">
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn" onClick={() => handleDelete(meter)} aria-label="delete">
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
        title={editingId ? t("common.actions.edit") : t("common.actions.create")}
      >
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>{t("meters.columns.property")}</span>
            <select
              value={form.property_id}
              onChange={(e) => setForm({ ...form, property_id: e.target.value, unit_id: "" })}
              required
            >
              <option value="" disabled>
                —
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t("meters.columns.location")}</span>
            <select value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
              <option value="">{t("meters.generalLocation")}</option>
              {unitsForSelectedProperty.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t("meters.columns.type")}</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="ELECTRICITY">{t("common.serviceType.ELECTRICITY")}</option>
              <option value="WATER">{t("common.serviceType.WATER")}</option>
            </select>
          </label>
          <label className="field">
            <span>{t("meters.columns.code")}</span>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </label>
          <label className="field">
            <span>{t("meters.columns.unit")}</span>
            <input
              value={form.measurement_unit}
              onChange={(e) => setForm({ ...form, measurement_unit: e.target.value })}
              placeholder="kWh / m3"
              required
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.is_shared}
              onChange={(e) => setForm({ ...form, is_shared: e.target.checked })}
            />
            {t("common.meterMode.shared")}
          </label>
          <label className="field">
            <span>{t("meters.columns.provider")}</span>
            <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
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
