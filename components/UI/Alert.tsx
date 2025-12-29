
import React from 'react';

type AlertType = 'success' | 'error' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const styles = {
    success: "bg-green-100 border-green-400 text-green-700",
    error: "bg-red-100 border-red-400 text-red-700",
    info: "bg-blue-100 border-blue-400 text-blue-700"
  };

  return (
    <div className={`border px-4 py-3 rounded-xl relative mb-4 ${styles[type]} shadow-sm`} role="status" aria-live="polite">
      <span className="block sm:inline">{message}</span>
      {onClose && (
        <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={onClose}>
          <span className="text-xl">&times;</span>
        </button>
      )}
    </div>
  );
};

export default Alert;
