/**
 * JSONB Content Validation
 *
 * Validates goal day content payloads to ensure data integrity
 * and prevent malformed content from being stored in the database.
 *
 * Security Benefits:
 * - Prevents injection of malicious content
 * - Ensures data consistency
 * - Type-safe content handling
 * - Clear error messages for content creators
 */

import { z } from 'zod';

/**
 * Text Content Schema
 * For daily devotionals, readings, or written content
 */
export const TextContentSchema = z.object({
  text: z
    .string()
    .min(10, 'Text content must be at least 10 characters')
    .max(10000, 'Text content must not exceed 10,000 characters'),
  formatting: z
    .enum(['plain', 'markdown'])
    .optional()
    .default('plain')
    .describe('Text formatting type'),
  scripture_reference: z
    .string()
    .max(100)
    .optional()
    .describe('Optional scripture reference (e.g., "John 3:16")'),
  reflection_prompt: z
    .string()
    .max(500)
    .optional()
    .describe('Optional reflection question for the user'),
});

/**
 * Exercise Content Schema
 * For physical or spiritual exercises
 */
export const ExerciseContentSchema = z.object({
  instruction: z
    .string()
    .min(10, 'Exercise instruction must be at least 10 characters')
    .max(1000, 'Exercise instruction must not exceed 1,000 characters'),
  duration_minutes: z
    .number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 minute')
    .max(120, 'Duration must not exceed 120 minutes'),
  demo_url: z
    .string()
    .url('Demo URL must be a valid URL')
    .optional()
    .describe('Optional video demonstration URL'),
  sets: z
    .number()
    .int('Sets must be a whole number')
    .min(1)
    .max(10)
    .optional()
    .describe('Number of sets (for repetitive exercises)'),
  reps: z
    .number()
    .int('Reps must be a whole number')
    .min(1)
    .max(100)
    .optional()
    .describe('Repetitions per set'),
  difficulty: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .describe('Exercise difficulty level'),
});

/**
 * Checklist Content Schema
 * For daily tasks or prayer points
 */
export const ChecklistContentSchema = z.object({
  items: z
    .array(
      z
        .string()
        .min(1, 'Checklist items must not be empty')
        .max(500, 'Checklist items must not exceed 500 characters')
    )
    .min(1, 'Checklist must have at least 1 item')
    .max(20, 'Checklist must not exceed 20 items'),
  allow_custom_items: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether users can add their own items'),
  require_all_complete: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether all items must be checked to complete the day'),
});

/**
 * Combined content type for type inference
 */
export type TextContent = z.infer<typeof TextContentSchema>;
export type ExerciseContent = z.infer<typeof ExerciseContentSchema>;
export type ChecklistContent = z.infer<typeof ChecklistContentSchema>;

export type ContentPayload = TextContent | ExerciseContent | ChecklistContent;

/**
 * Validate content payload based on type
 *
 * @param type - Content type from database enum
 * @param payload - Content payload to validate
 * @returns Validated and typed content payload
 * @throws ZodError if validation fails
 *
 * Usage:
 * ```typescript
 * try {
 *   const validated = validateContentPayload('text', rawPayload);
 *   // validated is now type-safe
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     console.error('Validation errors:', error.errors);
 *   }
 * }
 * ```
 */
export function validateContentPayload(
  type: 'text' | 'exercise' | 'checklist',
  payload: unknown
): ContentPayload {
  switch (type) {
    case 'text':
      return TextContentSchema.parse(payload);
    case 'exercise':
      return ExerciseContentSchema.parse(payload);
    case 'checklist':
      return ChecklistContentSchema.parse(payload);
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
}

/**
 * Safely validate content payload without throwing
 *
 * @param type - Content type from database enum
 * @param payload - Content payload to validate
 * @returns Validation result with success flag and data or errors
 *
 * Usage:
 * ```typescript
 * const result = safeValidateContentPayload('text', rawPayload);
 * if (result.success) {
 *   // result.data is validated content
 * } else {
 *   // result.errors contains validation errors
 * }
 * ```
 */
export function safeValidateContentPayload(
  type: 'text' | 'exercise' | 'checklist',
  payload: unknown
): { success: true; data: ContentPayload } | { success: false; errors: z.ZodIssue[] } {
  try {
    const data = validateContentPayload(type, payload);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    throw error;
  }
}

/**
 * Get user-friendly error messages from Zod errors
 *
 * @param errors - Array of Zod issues
 * @returns Array of formatted error messages
 */
export function formatContentErrors(errors: z.ZodIssue[]): string[] {
  return errors.map((error) => {
    const path = error.path.join('.');
    return `${path}: ${error.message}`;
  });
}

/**
 * Validate content size to prevent DoS
 *
 * @param payload - Content payload object
 * @param maxSizeKB - Maximum size in kilobytes (default: 100KB)
 * @throws Error if payload is too large
 */
export function validateContentSize(payload: unknown, maxSizeKB: number = 100): void {
  const jsonSize = JSON.stringify(payload).length;
  const maxBytes = maxSizeKB * 1024;

  if (jsonSize > maxBytes) {
    const actualSizeKB = (jsonSize / 1024).toFixed(1);
    throw new Error(
      `Content payload is too large: ${actualSizeKB}KB (maximum: ${maxSizeKB}KB)`
    );
  }
}

/**
 * Example usage for goal day content validation
 */
export function validateGoalDayContent(
  type: 'text' | 'exercise' | 'checklist',
  payload: unknown
): {
  isValid: boolean;
  data?: ContentPayload;
  errors?: string[];
} {
  // Check size first
  try {
    validateContentSize(payload, 100);
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Invalid content size'],
    };
  }

  // Validate content structure
  const result = safeValidateContentPayload(type, payload);

  if (result.success) {
    return {
      isValid: true,
      data: result.data,
    };
  } else {
    return {
      isValid: false,
      errors: formatContentErrors(result.errors),
    };
  }
}
