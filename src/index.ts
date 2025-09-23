import type { DangerDSLType } from "danger/distribution/dsl/DangerDSL";

declare const danger: DangerDSLType;

/**
 * Add tasks to the PR, not adding the ones already present.
 * The implementation fetches all tasks and compares them with the ones to be added.
 * Therefore, it's more efficient to add all tasks at once (rather than calling this method multiple times)
 * Concurrent calls to this method may result in adding the same task multiple times.
 *
 * Usage example: schedule(addTasks(["my task 1","my task 2"]))
 */
export async function addTasks(rawTaskContentArray: string[]): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = (danger as any).bitbucket_cloud.api;
   
  const prUrl: string =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (danger as any).bitbucket_cloud.pr.links.self.href + "/tasks";

  // Fetch existing tasks (first page up to 100)
  let res = await api.get(prUrl + "?pagelen=100", {}, {});
  throwErrorIfNotOK(res);
  const json = await res.json();
  const rawContentTasks: string[] = (json.values ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => item.content.raw as string,
  );

  for (let i = 0; i < rawTaskContentArray.length; i++) {
    if (!rawContentTasks.includes(rawTaskContentArray[i])) {
      const body = { content: { raw: rawTaskContentArray[i] } };
      res = await api.post(prUrl, {}, body);
      throwErrorIfNotOK(res);
    }
  }
}

/**
 * Add reviewers to the PR.
 * Usage example: schedule(addReviewers(["557058:9c6d0619-9999-1111-2222-73e0d7399fff"]))
 *
 * @param reviewerAAIDs array of AAIDs of the reviewers to be added
 */
export async function addReviewers(reviewerAAIDs: string[]): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = (danger as any).bitbucket_cloud.api;
   
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prUrl: string = (danger as any).bitbucket_cloud.pr.links.self.href;

  // Fetch current PR state (including reviewers)
  let res = await api.put(prUrl, {}, {});
  throwErrorIfNotOK(res);
  const current = await res.json();
  const originalReviewersAAIDs: string[] = (current.reviewers ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => item.account_id as string,
  );

  // Merge and dedupe
  const merged = Array.from(
    new Set([...originalReviewersAAIDs, ...reviewerAAIDs]),
  );

  // Update PR reviewers
  res = await api.put(
    prUrl,
    {},
    { reviewers: merged.map((item) => ({ account_id: item })) },
  );
  throwErrorIfNotOK(res);
}

/**
 * Check if the response is ok, if not throws Error
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function throwErrorIfNotOK(res: any): void {
  if (!res || !res.ok) {
    const status = res?.status ?? "";
    const statusText = res?.statusText ?? "";
    throw new Error(`${status} ${statusText}`.trim());
  }
}
