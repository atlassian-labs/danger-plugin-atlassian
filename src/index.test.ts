import { beforeEach, describe, expect, it, vi } from "vitest";
import { addReviewers, addTasks } from "./index";

// Mock danger module to avoid runtime import errors in tests
vi.mock("danger", () => ({
  message: vi.fn(),
  warn: vi.fn(),
  fail: vi.fn(),
}));

// Use globalThis to set the global danger DSL expected by the plugin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeResponse = (ok: boolean, jsonData: any = {}) => ({
  ok,
  status: ok ? 200 : 500,
  statusText: ok ? "OK" : "ERR",
  json: async () => jsonData,
});

const setupDangerMock = () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  };
  const pr = {
    links: {
      self: {
        href: "https://api.bitbucket.org/2.0/repositories/ws/repo/pullrequests/1",
      },
    },
  };
  g.danger = { bitbucket_cloud: { api, pr } };
  return { api };
};

describe("addTasks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts only new tasks", async () => {
    const { api } = setupDangerMock();
    api.get.mockResolvedValueOnce(
      makeResponse(true, { values: [{ content: { raw: "existing" } }] }),
    );
    api.post.mockResolvedValue(makeResponse(true, {}));

    await addTasks(["existing", "new1", "new2"]);

    expect(api.get).toHaveBeenCalledWith(
      "https://api.bitbucket.org/2.0/repositories/ws/repo/pullrequests/1/tasks?pagelen=100",
      {},
      {},
    );
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post).toHaveBeenNthCalledWith(
      1,
      "https://api.bitbucket.org/2.0/repositories/ws/repo/pullrequests/1/tasks",
      {},
      { content: { raw: "new1" } },
    );
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      "https://api.bitbucket.org/2.0/repositories/ws/repo/pullrequests/1/tasks",
      {},
      { content: { raw: "new2" } },
    );
  });

  it("warns when bitbucket_cloud missing", async () => {
    const warn = vi.fn();
    g.danger = { warn };

    await addTasks(["x"]);

    expect(warn).toHaveBeenCalledWith(
      "addTasks requires bitbucket_cloud.api. Skipping.",
    );
  });

  it("throws on GET failure", async () => {
    const { api } = setupDangerMock();
    api.get.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "ERR",
    });

    await expect(addTasks(["x"])).rejects.toThrowError();
  });
});

describe("addReviewers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("merges and dedupes reviewers before updating", async () => {
    const { api } = setupDangerMock();
    api.put
      // first PUT returns current PR payload
      .mockResolvedValueOnce(
        makeResponse(true, {
          reviewers: [{ account_id: "A" }, { account_id: "B" }],
        }),
      )
      // second PUT is the update request
      .mockResolvedValueOnce(makeResponse(true, {}));

    await addReviewers(["B", "C"]);

    expect(api.put).toHaveBeenNthCalledWith(
      1,
      "https://api.bitbucket.org/2.0/repositories/ws/repo/pullrequests/1",
      {},
      {},
    );
    expect(api.put).toHaveBeenNthCalledWith(
      2,
      "https://api.bitbucket.org/2.0/repositories/ws/repo/pullrequests/1",
      {},
      {
        reviewers: [
          { account_id: "A" },
          { account_id: "B" },
          { account_id: "C" },
        ],
      },
    );
  });

  it("warns when bitbucket_cloud missing", async () => {
    const warn = vi.fn();
    g.danger = { warn };

    await addReviewers(["x"]);

    expect(warn).toHaveBeenCalledWith(
      "addReviewers requires bitbucket_cloud.api. Skipping.",
    );
  });

  it("throws on initial PUT failure", async () => {
    const { api } = setupDangerMock();
    api.put.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad",
    });

    await expect(addReviewers(["X"])).rejects.toThrowError();
  });
});
