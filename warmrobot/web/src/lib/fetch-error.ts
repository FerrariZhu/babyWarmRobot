function isConnectError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||
    msg.includes("network") ||
    msg.includes("econnrefused") ||
    msg.includes("other side closed")
  );
}

export function formatFetchErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  if (isConnectError(error)) {
    return "网络请求失败，请确认开发服务器与相关服务正在运行后重试";
  }
  return error.message || fallback;
}

export function isFetchConnectError(error: unknown): boolean {
  return isConnectError(error);
}
