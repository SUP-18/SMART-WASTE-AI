'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  const { id, message, type } = toast;
  
  const icons = {
    success: <CheckCircle className="toast-icon success" />,
    error: <XCircle className="toast-icon error" />,
    info: <Info className="toast-icon info" />,
    warning: <AlertTriangle className="toast-icon warning" />,
  };

  return (
    <div className={`toast toast-${type} slide-in`}>
      {icons[type] || icons.info}
      <p className="toast-message">{message}</p>
      <button className="toast-close" onClick={() => onRemove(id)}>
        <X size={16} />
      </button>
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
