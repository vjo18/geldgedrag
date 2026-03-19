export function getBasePath(path = "/") {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!normalizedBase) return normalizedPath;
  if (normalizedPath === "/") return `${normalizedBase}/`;

  return `${normalizedBase}${normalizedPath}`;
}
