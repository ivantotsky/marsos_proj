"use client";
import * as React from "react";

// Mock loader; swap out for your real API call
const loadSavedAddresses = () =>
  new Promise((res) =>
    setTimeout(
      () =>
        res([
          {
            id: "home",
            label: "Home",
            line1: "123 King Fahd St.",
            line2: "Riyadh 11451",
          },
          {
            id: "work",
            label: "Work",
            line1: "456 Olaya Rd.",
            line2: "Riyadh 12211",
          },
        ]),
      500
    )
  );

export function useSavedAddresses() {
  const [addresses, setAddresses] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const fetch = React.useCallback(() => {
    setError(null);
    setIsLoading(true);
    loadSavedAddresses()
      .then(setAddresses)
      .catch(() => setError("Failed to load addresses"))
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(fetch, [fetch]);

  return { addresses, isLoading, error, reload: fetch };
}
