interface ErrorWithCode {
  code: string
}

function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
}

export function getErrorCode(error: unknown) {
  if (isErrorWithCode(error)) return error.code
}
