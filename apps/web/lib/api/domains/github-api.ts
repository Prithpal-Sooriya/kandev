import { fetchJson, type ApiRequestOptions } from "../client";
import type {
  GitHubStatusResponse,
  GitHubPR,
  TaskPRsResponse,
  PRFeedback,
  GitHubPRStatus,
  PRStatsResponse,
} from "@/lib/types/github";

// NOTE: The /github browsing dashboard, review/issue watchers, and action
// presets were removed to cut GitHub API usage. This client now covers only
// the API surfaces that remain in use:
//   - status (needed by PR CI popover / task PR UI)
//   - task↔PR associations (auto-attached PRs on tickets)
//   - per-PR feedback, status, info, and review submission (task PR panels)
//   - repo branches + PR info for creating a task from a GitHub URL
//   - PR stats (DB-computed, no GitHub API calls)

// Status
export async function fetchGitHubStatus(options?: ApiRequestOptions) {
  return fetchJson<GitHubStatusResponse>("/api/v1/github/status", options);
}

// Task PR associations
export async function listWorkspaceTaskPRs(workspaceId: string, options?: ApiRequestOptions) {
  return fetchJson<TaskPRsResponse>(
    `/api/v1/github/task-prs?workspace_id=${encodeURIComponent(workspaceId)}`,
    options,
  );
}

// PR feedback (live from GitHub)
export async function getPRFeedback(
  owner: string,
  repo: string,
  number: number,
  options?: ApiRequestOptions,
) {
  return fetchJson<PRFeedback>(`/api/v1/github/prs/${owner}/${repo}/${number}`, options);
}

// Lightweight PR status (review + checks + mergeable), skips comments.
export async function getPRStatus(
  owner: string,
  repo: string,
  number: number,
  options?: ApiRequestOptions,
) {
  return fetchJson<GitHubPRStatus>(`/api/v1/github/prs/${owner}/${repo}/${number}/status`, options);
}

// Submit PR review
export async function submitPRReview(
  owner: string,
  repo: string,
  number: number,
  event: "APPROVE" | "COMMENT" | "REQUEST_CHANGES",
  body?: string,
) {
  return fetchJson<{ submitted: boolean }>(
    `/api/v1/github/prs/${owner}/${repo}/${number}/reviews`,
    {
      init: {
        method: "POST",
        body: JSON.stringify({ event, body: body ?? "" }),
      },
    },
  );
}

// PR info (lightweight)
export async function fetchPRInfo(
  owner: string,
  repo: string,
  number: number,
  options?: ApiRequestOptions,
) {
  return fetchJson<GitHubPR>(
    `/api/v1/github/prs/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${number}/info`,
    options,
  );
}

// Remote repo branches (task create dialog URL mode: create a task on a
// remote GitHub repo)
export async function fetchRepoBranches(owner: string, repo: string, options?: ApiRequestOptions) {
  return fetchJson<{ branches: { name: string }[] }>(
    `/api/v1/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`,
    options,
  );
}

// Stats (computed from the local DB, no GitHub API calls)
export async function fetchGitHubStats(
  params?: { workspace_id?: string; start_date?: string; end_date?: string },
  options?: ApiRequestOptions,
) {
  const query = new URLSearchParams();
  if (params?.workspace_id) query.set("workspace_id", params.workspace_id);
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  const suffix = query.toString();
  return fetchJson<PRStatsResponse>(`/api/v1/github/stats${suffix ? `?${suffix}` : ""}`, options);
}
