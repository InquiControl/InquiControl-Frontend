import { createContext, useCallback, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const { t } = useTranslation();
  const [state, setState] = useState(null);

  const confirm = useCallback(
    ({ title, body, confirmLabel, danger = true } = {}) =>
      new Promise((resolve) => {
        setState({
          title: title || t("common.feedback.confirmDeleteTitle"),
          body: body || t("common.feedback.confirmDeleteBody"),
          confirmLabel: confirmLabel || t("common.actions.delete"),
          danger,
          resolve
        });
      }),
    [t]
  );

  function handle(result) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" role="alertdialog" aria-modal="true">
          <div className="confirm-dialog">
            <div className={`confirm-dialog__icon ${state.danger ? "confirm-dialog__icon--danger" : ""}`}>
              <AlertTriangle size={20} />
            </div>
            <h3>{state.title}</h3>
            <p>{state.body}</p>
            <div className="confirm-dialog__actions">
              <button className="btn btn--ghost" onClick={() => handle(false)}>
                {t("common.actions.cancel")}
              </button>
              <button
                className={`btn ${state.danger ? "btn--danger-solid" : "btn--primary"}`}
                onClick={() => handle(true)}
                autoFocus
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  return ctx;
}
