const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const withBasePath = (path = "") => {
  if (!path || !BASE_PATH || !path.startsWith("/")) {
    return path;
  }

  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) {
    return path;
  }

  return path === "/" ? BASE_PATH : `${BASE_PATH}${path}`;
};

export const withoutBasePath = (path = "") => {
  if (!path || !BASE_PATH) {
    return path || "/";
  }

  if (path === BASE_PATH) {
    return "/";
  }

  if (path.startsWith(`${BASE_PATH}/`)) {
    return path.slice(BASE_PATH.length) || "/";
  }

  return path;
};
