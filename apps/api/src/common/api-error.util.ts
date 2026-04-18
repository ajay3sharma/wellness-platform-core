import { HttpException, HttpStatus } from "@nestjs/common";

export function createApiException(
  status: HttpStatus,
  code: string,
  message: string,
  details?: Record<string, unknown>
) {
  return new HttpException(
    {
      code,
      message,
      details
    },
    status
  );
}
