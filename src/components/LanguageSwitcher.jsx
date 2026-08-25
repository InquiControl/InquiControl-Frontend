import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";
import { ChevronDown } from "lucide-react";

const OPTIONS = [
  { code: "es", flag: "🇪🇸", short: "ES" },
  { code: "en", flag: "🇺🇸", short: "EN" }
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = OPTIONS.find((o) => o.code === i18n.language) || OPTIONS[0];

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        className="lang-switcher__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("common.language.label")}
        aria-expanded={open}
      >
        <span>{current.flag}</span>
        <span>{current.short}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="lang-switcher__menu" role="menu">
          {OPTIONS.map((option) => (
            <button
              key={option.code}
              className={"lang-switcher__option" + (option.code === current.code ? " lang-switcher__option--active" : "")}
              onClick={() => {
                changeLanguage(option.code);
                setOpen(false);
              }}
              role="menuitem"
            >
              <span>{option.flag}</span>
              <span>{t(`common.language.${option.code}`)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
