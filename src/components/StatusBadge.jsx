import { useTranslation } from "react-i18next";

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const normalized = (status || "").toUpperCase();
  const label = t(`common.status.${normalized}`, { defaultValue: status || "—" });
  return <span className={`badge badge--${normalized.toLowerCase()}`}>{label}</span>;
}
