export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown[];

  constructor(statusCode: number, code: string, message: string, details?: unknown[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, details?: unknown[]) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "غير مصرح بالدخول") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "لا تملك الصلاحية المطلوبة لتنفيذ هذا الإجراء") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "المورد غير موجود") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message: string) {
    return new ApiError(409, "CONFLICT", message);
  }

  static validation(message = "حدث خطأ في التحقق من البيانات", details?: unknown[]) {
    return new ApiError(422, "VALIDATION_ERROR", message, details);
  }

  static internal(message = "حدث خطأ غير متوقع") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}
