import { useAuth } from "@/lib/AuthContext";

export function useCurrentStudentId() {
  const { user } = useAuth();
  return user?.studentId || (user?.role === "user" ? user.id : null);
}
