export type Database = any; // Placeholder until gen types is run

export interface User {
  id: string;
  role: "admin" | "teacher" | "student";
  email: string;
}
