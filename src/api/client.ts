import axios from "axios";
import Constants from "expo-constants";

function resolveBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
  if (fromEnv) return fromEnv;
  const hostUri = Constants.expoConfig?.hostUri ?? "localhost:8081";
  const host = hostUri.split(":")[0];
  return `http://${host}:3000`;
}

export const API_BASE = resolveBase();
export const api = axios.create({ baseURL: API_BASE, timeout: 10000 });
