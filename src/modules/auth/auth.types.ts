export interface RegisterDto {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginDto {
  emailOrPhone: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    emailVerified: boolean;
    role: "admin" | "moderator" | "user";
  };
  token: string;
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  role: "admin" | "moderator" | "user";
  provider?: "local" | "google";
  createdAt: Date;
  updatedAt: Date;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}
