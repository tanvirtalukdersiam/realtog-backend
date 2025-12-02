export interface SendOTPDto {
  email: string;
}

export interface VerifyOTPDto {
  email: string;
  code: string;
}

export interface ResendOTPDto {
  email: string;
}

export interface OTPResponse {
  message: string;
  email: string;
}

export interface VerifyOTPResponse {
  message: string;
  email: string;
  verified: boolean;
}

