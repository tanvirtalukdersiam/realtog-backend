export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email/phone or password',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email or phone already exists',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_OTP: 'Invalid or expired OTP',
  OTP_NOT_FOUND: 'OTP not found',
  EMAIL_NOT_VERIFIED: 'Email not verified',
} as const;

export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'User logged in successfully',
  USER_RETRIEVED: 'User retrieved successfully',
  USERS_RETRIEVED: 'Users retrieved successfully',
  USER_ROLE_UPDATED: 'User role updated successfully',
  OTP_SENT: 'OTP sent successfully',
  OTP_VERIFIED: 'Email verified successfully',
  OTP_RESENT: 'OTP resent successfully',
  PRICING_PLANS_RETRIEVED: 'Pricing plans retrieved successfully',
  PRICING_PLAN_RETRIEVED: 'Pricing plan retrieved successfully',
  PRICING_PLAN_CREATED: 'Pricing plan created successfully',
  PRICING_PLAN_UPDATED: 'Pricing plan updated successfully',
  PRICING_PLAN_DELETED: 'Pricing plan deleted successfully',
  ORDER_CREATED: 'Order created successfully',
  ORDERS_RETRIEVED: 'Orders retrieved successfully',
  ORDER_RETRIEVED: 'Order retrieved successfully',
  ORDER_STATUS_UPDATED: 'Order status updated successfully',
  ORDER_SUBMISSION_UPLOADED: 'Submission uploaded successfully',
  MESSAGE_RECEIVED: 'Message received successfully',
  MESSAGE_SENT: 'Message sent successfully',
  CONVERSATIONS_RETRIEVED: 'Conversations retrieved successfully',
  CONVERSATION_RETRIEVED: 'Conversation retrieved successfully',
} as const;

