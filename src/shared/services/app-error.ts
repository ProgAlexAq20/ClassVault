export type AppErrorContext = Record<string, string | number | boolean | null | undefined>;

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erro inesperado.";
}

export function logAppError(scope: string, error: unknown, context: AppErrorContext = {}) {
  const details = {
    scope,
    message: getErrorMessage(error),
    ...context
  };

  console.error("[ClassVault]", details);
}

export function assertNonEmpty(value: string, fieldName: string, maxLength = 160) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${fieldName} e obrigatorio.`);
  if (normalized.length > maxLength) throw new Error(`${fieldName} deve ter no maximo ${maxLength} caracteres.`);
  return normalized;
}
