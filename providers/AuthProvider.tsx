import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  // useAuth сам восстановит сессию в useEffect
  useAuth();

  // Можно добавить глобальный стейт если нужно
  return <>{children}</>;
}
