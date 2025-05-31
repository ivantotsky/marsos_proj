"use client";
import * as React from "react";

// Mock loader; swap out for your real API call
const loadSavedCards = () =>
  new Promise((res) =>
    setTimeout(
      () =>
        res([
          { id: "pm_visa", label: "Visa •••• 4242", subtitle: "Exp 12/25" },
          { id: "pm_mc", label: "Mastercard •••• 4444", subtitle: "Exp 09/24" },
        ]),
      500
    )
  );

export function useSavedCards() {
  const [cards, setCards] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const fetch = React.useCallback(() => {
    setError(null);
    setIsLoading(true);
    loadSavedCards()
      .then(setCards)
      .catch(() => setError("Failed to load cards"))
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(fetch, [fetch]);

  return { cards, isLoading, error, reload: fetch };
}
