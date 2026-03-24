import { afterEach, describe, expect, it } from "vitest";

import { resolveApiBaseUrl } from "./tasks-api.server";

describe("resolveApiBaseUrl", () => {
  afterEach(() => {
    delete process.env.API_BASE_URL;
    delete process.env.VITE_API_BASE_URL;
  });

  it("uses API_BASE_URL when provided", () => {
    process.env.API_BASE_URL = "http://backend:3000/";

    expect(resolveApiBaseUrl()).toBe("http://backend:3000");
  });

  it("falls back to request same-origin /api when no env is provided", () => {
    const request = new Request("https://task-manager.example.com/tasks?q=bug");

    expect(resolveApiBaseUrl(request)).toBe("https://task-manager.example.com/api");
  });

  it("falls back to localhost when no env or request exists", () => {
    expect(resolveApiBaseUrl()).toBe("http://localhost:3000/api");
  });
});
