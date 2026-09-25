import type { JwtPayload } from "jsonwebtoken";

export interface AuthTokenPayload extends JwtPayload {
  id: number;
  name: string;
  client?: "mobile";
}
