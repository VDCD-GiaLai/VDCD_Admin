/**
 * OperationField — categories for programs, solutions, projects.
 * Maps to DB `operation_field` table + /operation-fields API.
 */
export interface OperationField {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  shortDescription: string | null;
  order: number;
}
