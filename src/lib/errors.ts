import { Response, Request, NextFunction } from "express";
import { ZodError } from "zod";
import * as Sentry from "@sentry/node";

// Base class for our custom API errors
export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Invalid input") {
    super(message, 400);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "A conflict occurred") {
    super(message, 409);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "An internal server error occurred") {
    super(message, 500);
  }
}

// Centralized error handling utility
export const handleApiError = (err: unknown, res: Response) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Invalid request payload",
        code: "validation_error",
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  if (err instanceof ApiError && !(err instanceof InternalServerError)) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.constructor.name
          .replace(/Error$/, "")
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase()
          .slice(1), // Converts "NotFoundError" to "not_found"
      },
    });
    return;
  }

  // Fallback for unexpected errors and InternalServerErrors
  console.error("An unexpected or internal server error occurred:", err);

  // Only capture unexpected or internal server errors in Sentry
  Sentry.captureException(err);

  res.status(500).json({
    error: {
      message: "An internal server error occurred.",
      code: "internal_server_error",
    },
  });
};

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  handleApiError(err, res);
};
