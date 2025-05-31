import { toast } from "react-toastify";
import {
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Loader,
} from "react-feather";

const baseStyle = {
  background: "#2c6449",
  color: "#fff",
  fontSize: "0.9rem",
  fontWeight: "500",
};

// Feather icon wrapper
const iconStyle = { width: 20, height: 20 };

export const showSuccess = (message, options = {}) => {
  toast.success(message, {
    style: baseStyle,
    icon: <CheckCircle style={{ ...iconStyle, color: "#fff" }} />,
    ...options,
  });
};

export const showError = (message, options = {}) => {
  toast.error(message, {
    style: { ...baseStyle, background: "#b91c1c" },
    icon: <XCircle style={{ ...iconStyle, color: "#fff" }} />,
    ...options,
  });
};

export const showInfo = (message, options = {}) => {
  toast.info(message, {
    style: baseStyle,
    icon: <Info style={{ ...iconStyle, color: "#fff" }} />,
    ...options,
  });
};

export const showWarning = (message, options = {}) => {
  toast.warn(message, {
    style: { ...baseStyle, background: "#d97706" },
    icon: <AlertTriangle style={{ ...iconStyle, color: "#fff" }} />,
    ...options,
  });
};

export const showPromiseToast = (promise, messages = {}, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || "Processing...",
      success: messages.success || "Done!",
      error: messages.error || "Something went wrong.",
    },
    {
      style: baseStyle,
      icon: (
        <Loader
          className='animate-spin'
          style={{ color: "#fff", width: 18, height: 18 }}
        />
      ),
      ...options,
    }
  );
};
