import { readSession } from "@/lib/github-auth";
import {
  getPull,
  githubErrorResponse,
  invalidRepoResponse,
  isValidPrNumber,
  listPullFiles,
} from "@/lib/github";
import { toFileDiffs } from "@/lib/diff";
import { planReview } from "@/lib/review-core";
import type { PRDetail } from "@/lib/types";

/** Returns the PR's details (including its head SHA) together with its parsed diff. */
export async function GET(
  req: Request,
  ctx: RouteContext<"/api/repos/[owner]/[repo]/prs/[number]/diff">,
) {
  const token = await readSession(req);
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { owner, repo, number } = await ctx.params;
  const invalid = invalidRepoResponse(owner, repo);
  if (invalid) return invalid;
  if (!isValidPrNumber(number)) {
    return Response.json({ error: "PR number must be numeric" }, { status: 400 });
  }

  const n = Number(number);
  const [pull, files] = await Promise.all([
    getPull(token, owner, repo, n),
    listPullFiles(token, owner, repo, n),
  ]);
  if (!pull.ok) return githubErrorResponse(pull.status);
  if (!files.ok) return githubErrorResponse(files.status);

  const p = pull.data;
  const pr: PRDetail = {
    number: p.number,
    title: p.title,
    author: p.user?.login ?? "unknown",
    branch: p.head.ref,
    headSha: p.head.sha,
    htmlUrl: p.html_url,
    additions: p.additions,
    deletions: p.deletions,
    filesChanged: p.changed_files,
  };
  const scopes = planReview(files.data).map((f) => f.scope);

  return Response.json({ pr, files: toFileDiffs(files.data, scopes) });
}
