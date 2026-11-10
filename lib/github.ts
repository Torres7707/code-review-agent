export class GitHubApiError extends Error {
  status: number;

  constructor(status: number) {
    super(`GitHub API responded with ${status}`);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

export async function githubJson<T>(
  token: string,
  path: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, data: (await res.json()) as T };
}
