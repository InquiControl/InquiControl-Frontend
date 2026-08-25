import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, kind = "success") => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, kind }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const api = {
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error")
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.kind}`}>
            {toast.kind === "success" ? (
              <CheckCircle2 size={18} strokeWidth={2} />
            ) : (
              <XCircle size={18} strokeWidth={2} />
            )}
            <span>{toast.message}</span>
            <button className="toast__close" onClick={() => dismiss(toast.id)} aria-label="close">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
