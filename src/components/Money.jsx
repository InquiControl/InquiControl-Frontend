import { useTranslation } from "react-i18next";
import { formatMoney as formatMoneyUtil } from "../utils/format";

export function formatMoney(value, lang) {
  return formatMoneyUtil(value, lang);
}

export default function Money({ value }) {
  const { i18n } = useTranslation();
  return <span className="money">{formatMoneyUtil(value, i18n.language)}</span>;
}
