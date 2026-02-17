import "@std/dotenv/load";

const env = Deno.env.toObject();

const getEnv = (key: string, defaultValue?: string): string => {
  const value = env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

const getEnvArray = (key: string, defaultValue: string[] = []): string[] => {
  const value = env[key];
  if (!value) return defaultValue;
  return value.split(",").map((id) => id.trim()).filter(Boolean);
};

export const config = {
  BOT_TOKEN: getEnv("BOT_TOKEN"),
  DENO_KV_URL: env["DENO_KV_URL"],
  REPLICATE_API_TOKEN: env["REPLICATE_API_TOKEN"],
  ADMIN_USER_IDS: getEnvArray("ADMIN_USER_IDS"),
  DENO_DEPLOYMENT_ID: env["DENO_DEPLOYMENT_ID"],
  PROJECT_ID: "zeckson-finance-bot",
  ROOT_USER_ID: getEnvArray("ADMIN_USER_IDS")[0],
};
