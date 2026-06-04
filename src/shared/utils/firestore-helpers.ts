/**
 * Removes undefined values from an object before saving to Firestore.
 * Firestore does not accept undefined values - they must be null or omitted.
 * 
 * @param data - Object to clean
 * @returns Object with undefined values removed
 */
export function cleanFirestoreData<T extends Record<string, unknown>>(data: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values entirely (don't include them in the document)
    if (value === undefined) {
      continue;
    }
    
    // Preserve null values (Firestore accepts null)
    // Preserve serverTimestamp() and other special Firestore values
    cleaned[key] = value;
  }
  
  return cleaned as Partial<T>;
}

/**
 * Converts empty strings and undefined to null for optional fields.
 * Use this for fields that should be nullable in Firestore.
 * 
 * @param value - Value to normalize
 * @returns null if value is undefined or empty string, otherwise the trimmed value
 */
export function nullableString(value: string | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Converts empty strings and undefined to undefined (to be omitted).
 * Use this for truly optional fields that should not exist if empty.
 * 
 * @param value - Value to normalize
 * @returns undefined if value is empty, otherwise the trimmed value
 */
export function optionalString(value: string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
