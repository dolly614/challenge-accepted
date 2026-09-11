import { createServerFn } from "@tanstack/react-start";

/** Public homepage payload — safe aggregate/marketing data only. */
export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const { loadHomeData } = await import("./home.server");
  try {
    return await loadHomeData();
  } catch (error) {
    console.error("[home] failed to load public data", error);
    return null;
  }
});
