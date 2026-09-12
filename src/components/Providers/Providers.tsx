"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import type { Actor } from "@/lib/permissions";
import { Illustration } from "../Illustration/Illustration";
import styles from "../../styles/Feedback.module.scss";
const ToastContext = createContext<(message: string, error?: boolean) => void>(
  () => {},
);
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
      }),
  );
  const [toast, setToast] = useState<{
    message: string;
    error: boolean;
    id: number;
  } | null>(null);
  const notify = useCallback(
    (message: string, error = false) =>
      setToast({ message, error, id: Date.now() }),
    [],
  );
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5300);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={notify}>
        {children}
        {toast && (
          <div
            key={toast.id}
            className={styles.toast}
            role={toast.error ? "alert" : "status"}
          >
            <Illustration kind="sunflower" />
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              aria-label="Закрити повідомлення"
            >
              ×
            </button>
          </div>
        )}
      </ToastContext.Provider>
    </QueryClientProvider>
  );
}
export const useToast = () => useContext(ToastContext);
export function useViewer() {
  return useQuery<{ actor: Actor | null; authConfigured: boolean }>({
    queryKey: ["viewer"],
    queryFn: async () => {
      const response = await fetch("/api/viewer");
      if (!response.ok) throw new Error("VIEWER_FAILED");
      return response.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 60000,
  });
}
