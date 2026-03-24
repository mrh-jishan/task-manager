import { afterEach, describe, expect, it, vi } from "vitest";

import { TASK_TITLE_MAX_LENGTH } from "../lib/tasks";
import { action, loader } from "./home";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildRouteArgs(request: Request) {
  return {
    request,
    params: {},
    context: {},
  } as never;
}

describe("home route data integration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.API_BASE_URL;
  });

  it("loads tasks with search, status, and pagination filters", async () => {
    process.env.API_BASE_URL = "http://backend:3000";

    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: 1,
            title: "Investigate payment failure",
            description: "Customer cannot complete checkout",
            status: "open",
            priority: "high",
            due_at: null,
            completed_at: null,
            created_at: "2026-03-23T00:00:00Z",
            updated_at: "2026-03-23T00:00:00Z",
          },
        ],
        pagination: {
          page: 2,
          per_page: 6,
          total_count: 7,
          total_pages: 2,
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await loader(
      buildRouteArgs(new Request("http://app.local/?q=invoice&status=open&page=2")),
    );

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as URL);

    expect(requestedUrl.origin).toBe("http://backend:3000");
    expect(requestedUrl.pathname).toBe("/tasks");
    expect(requestedUrl.searchParams.get("q")).toBe("invoice");
    expect(requestedUrl.searchParams.get("status")).toBe("open");
    expect(requestedUrl.searchParams.get("page")).toBe("2");
    expect(requestedUrl.searchParams.get("per_page")).toBe("6");
    expect(result.tasks).toHaveLength(1);
    expect(result.pagination.total_pages).toBe(2);
  });

  it("redirects back to the current route after creating a task", async () => {
    process.env.API_BASE_URL = "http://backend:3000";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          id: 3,
          title: "Ship release",
          description: "",
          status: "open",
          priority: "urgent",
          due_at: null,
          completed_at: null,
          created_at: "2026-03-23T00:00:00Z",
          updated_at: "2026-03-23T00:00:00Z",
        }, 201),
      ),
    );

    const formData = new FormData();
    formData.set("intent", "create");
    formData.set("title", "Ship release");
    formData.set("description", "");
    formData.set("status", "open");
    formData.set("priority", "urgent");
    formData.set("due_at", "");

    const response = (await action(
      buildRouteArgs(
        new Request("http://app.local/?q=release&page=2", {
          method: "POST",
          body: formData,
        }),
      ),
    )) as Response;

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/?q=release&page=2");
  });

  it("returns validation details when the backend rejects an update", async () => {
    process.env.API_BASE_URL = "http://backend:3000";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ errors: ["Title can't be blank"] }, 422)),
    );

    const formData = new FormData();
    formData.set("intent", "update");
    formData.set("id", "7");
    formData.set("title", "");
    formData.set("description", "");
    formData.set("status", "open");
    formData.set("priority", "medium");
    formData.set("due_at", "");

    const result = await action(
      buildRouteArgs(
        new Request("http://app.local/", {
          method: "POST",
          body: formData,
        }),
      ),
    );

    expect(result).toMatchObject({
      intent: "update",
      taskId: "7",
      errors: ["Title is required."],
    });
  });

  it("validates create input before calling the backend" , async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const formData = new FormData();
    formData.set("intent", "create");
    formData.set("title", "x".repeat(TASK_TITLE_MAX_LENGTH + 1));
    formData.set("description", "");
    formData.set("status", "open");
    formData.set("priority", "medium");
    formData.set("due_at", "");

    const result = await action(
      buildRouteArgs(
        new Request("http://app.local/", {
          method: "POST",
          body: formData,
        }),
      ),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      intent: "create",
      errors: [`Title must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`],
      values: {
        title: "x".repeat(TASK_TITLE_MAX_LENGTH + 1),
      },
    });
  });
});
