import type { GitHubFilePatch } from "@/lib/diff";

export type GitHubResult<T> = { ok: true; data: T } | { ok: false; status: number };

// GitHub logins: alphanumerics and single hyphens, at most 39 characters.
const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
// Repository names: alphanumerics, ".", "_", "-", at most 100 characters.
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;

export function isValidOwner(owner: string): boolean {
  return OWNER_RE.test(owner);
}

export function isValidRepo(repo: string): boolean {
  return REPO_RE.test(repo) && repo !== "." && repo !== "..";
}

export function isValidPrNumber(value: string): boolean {
  return /^[1-9]\d{0,9}$/.test(value);
}

/** Builds `/repos/{owner}/{repo}` from validated, URL-encoded parts. */
export function repoPath(owner: string, repo: string): string {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

/** Rejects owner/repo values that could escape the intended GitHub API path. */
export function invalidRepoResponse(owner: string, repo: string): Response | null {
  if (isValidOwner(owner) && isValidRepo(repo)) return null;
  return Response.json({ error: "Invalid owner or repository name" }, { status: 400 });
}

export async function githubJson<T>(token: string, path: string): Promise<GitHubResult<T>> {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (await res.json()) as T };
  } catch (error) {
    console.error(`GitHub request failed: ${path}`, error);
    return { ok: false, status: 502 };
  }
}

/** Maps a failed GitHub call onto the status our own API returns. */
export function githubErrorResponse(status: number): Response {
  // 401 means the stored token is no longer valid: the client signs the user out.
  if (status === 401) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (status === 403 || status === 429) {
    return Response.json({ error: "GitHub rate limit or permission error" }, { status: 403 });
  }
  if (status === 404) return Response.json({ error: "Not found on GitHub" }, { status: 404 });
  return Response.json({ error: "GitHub request failed" }, { status: 502 });
}

export type GitHubPull = {
  number: number;
  title: string;
  state: string;
  html_url: string;
  updated_at: string;
  additions: number;
  deletions: number;
  changed_files: number;
  user: { login: string } | null;
  head: { ref: string; sha: string };
};

export function getPull(token: string, owner: string, repo: string, number: number) {
  return githubJson<GitHubPull>(token, `${repoPath(owner, repo)}/pulls/${number}`);
}

// GitHub serves at most 3000 files per PR, 100 per page.
const MAX_FILE_PAGES = 30;

/** Lists every changed file of a PR, following pagination. */
export async function listPullFiles(
  token: string,
  owner: string,
  repo: string,
  number: number,
): Promise<GitHubResult<GitHubFilePatch[]>> {
  const all: GitHubFilePatch[] = [];
  for (let page = 1; page <= MAX_FILE_PAGES; page += 1) {
    const res = await githubJson<GitHubFilePatch[]>(
      token,
      `${repoPath(owner, repo)}/pulls/${number}/files?per_page=100&page=${page}`,
    );
    if (!res.ok) return res;
    all.push(...res.data);
    if (res.data.length < 100) break;
  }
  return { ok: true, data: all };
}
