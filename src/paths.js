const buildBase = import.meta.env?.BASE_URL || "/";

export function appUrl(path = "", base = buildBase) {
  const prefix = `/${base.replace(/^\/+|\/+$/g, "")}`;
  return `${prefix === "/" ? "" : prefix}/${path.replace(/^\/+/, "")}`;
}

export function appRoute(pathname, base = buildBase) {
  const prefix = appUrl("", base).replace(/\/$/, "");
  const route = pathname === prefix || pathname.startsWith(`${prefix}/`)
    ? pathname.slice(prefix.length)
    : pathname;
  return route.replace(/\/+$/, "") || "/";
}
