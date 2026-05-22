import { useCallback } from "react";
import Swal from "sweetalert2";

import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export const useAlert = () => {
  const info = useCallback((title = "Info", message = "") => {
    return MySwal.fire({
      icon: "info",
      title,
      text: message,
      confirmButtonText: "OK",
    });
  }, []);

  const confirmHtml = useCallback(
    async (title = "Are you sure?", message = "") => {
      const result = await MySwal.fire({
        icon: "question",
        title,
        html: message,
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
      });
      return result.isConfirmed;
    },
    [],
  );

  const success = useCallback((title = "Success", message = "") => {
    return MySwal.fire({
      icon: "success",
      title,
      text: message,
      confirmButtonText: "OK",
    });
  }, []);

  const error = useCallback((title = "Error", message = "") => {
    return MySwal.fire({
      icon: "error",
      title,
      text: message,
      confirmButtonText: "OK",
    });
  }, []);

  const warning = useCallback((title = "Warning", message = "") => {
    return MySwal.fire({
      icon: "warning",
      title,
      text: message,
      confirmButtonText: "OK",
    });
  }, []);

  const confirm = useCallback(async (title = "Are you sure?", message = "") => {
    const result = await MySwal.fire({
      icon: "question",
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
    });
    return result.isConfirmed;
  }, []);

  const loading = useCallback((title = "Loading...") => {
    MySwal.fire({
      title,
      allowOutsideClick: false,
      didOpen: () => {
        MySwal.showLoading();
      },
    });
  }, []);

  const close = useCallback(() => {
    MySwal.close();
  }, []);

  const successHtml = useCallback((title = "Success", message = "") => {
    return MySwal.fire({
      icon: null, // disable built-in icon
      title,
      html: message, // use html for JSX/React components
      confirmButtonText: "OK",
    });
  }, []);

  return {
    info,
    success,
    error,
    warning,
    confirm,
    confirmHtml,
    loading,
    close,
  };
};
