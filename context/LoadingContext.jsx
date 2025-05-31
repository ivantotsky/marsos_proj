"use client";
import { createContext, useContext, useState, useEffect } from "react";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true); // Start TRUE initially!

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  useEffect(() => {
    // Simulate first page load finish after short delay (e.g., 1s)
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Adjust 800ms as you want

    return () => clearTimeout(timeout);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
