import type { ApiResponse } from "@/types";
import { logger } from "@/lib/logger";

export abstract class BaseService {
  protected success<T>(data: T): ApiResponse<T> {
    return { success: true, data };
  }

  protected failure(error: string): ApiResponse<never> {
    return { success: false, error };
  }

  protected logError(context: string, error: unknown) {
    logger.error(
      context,
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error
    );
  }
}
