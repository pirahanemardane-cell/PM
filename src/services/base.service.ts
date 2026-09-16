import type { ApiResponse } from "@/types";

export abstract class BaseService {
  protected success<T>(data: T): ApiResponse<T> {
    return {
      data,
      error: null,
      success: true,
    };
  }

  protected failure<T = null>(error: string): ApiResponse<T> {
    return {
      data: null as T,
      error,
      success: false,
    };
  }
}
