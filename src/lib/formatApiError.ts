/** Extract a readable message from axios/FastAPI errors. */
export function formatApiError(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object' || !('response' in err)) {
    return fallback;
  }
  const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: string }).msg);
        }
        return JSON.stringify(item);
      })
      .join('; ');
  }
  return fallback;
}
