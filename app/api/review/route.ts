import { Output, streamText } from "ai";
import { NextResponse } from "next/server";
import { readSession } from "@/lib/github-auth";
import { githubJson } from "@/lib/github";
import { REVIEW_PROMPT } from "@/lib/prompt";
import {
  buildReviewPrompt,
  trimPatch,
  MAX_REVIEW_FILES,
  type ReviewInput,
} from "@/lib/review-core";
import { reviewSchema } from "@/lib/review-schema";

export const maxDuration = 60;

type GitHubFile = {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
};

type GitHubPull = {
  title: string;
  number: number;
  head: { ref: string };
};

// Keeps the model prompt bounded: diffs are the expensive part of the request.
const MAX_FILES = MAX_REVIEW_FILES;

async function loadPrInput(
  token: string,
  owner: string,
  repo: string,
  number: number,
): Promise<ReviewInput> {
  const pull = await githubJson<GitHubPull>(token, `/repos/${owner}/${repo}/pulls/${number}`);
  const files = await githubJson<GitHubFile[]>(
    token,
    `/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`,
  );
  if (!pull.ok || !files.ok) {
    const status = !pull.ok ? pull.status : !files.ok ? files.status : 0;
    throw new Error(`GitHub API error: ${status}`);
  }
  return {
    pr: {
      number: pull.data.number,
      title: pull.data.title,
      branch: pull.data.head.ref,
    },
    files: files.data.slice(0, MAX_FILES).map((f) => ({
      path: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      patch: trimPatch(f.patch),
    })),
  };
}

export async function POST(req: Request) {
  let body: ReviewInput & { owner?: string; repo?: string };
  try {
    body = (await req.json()) as ReviewInput & { owner?: string; repo?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // When owner/repo/number are supplied, fetch the real diff from GitHub
  // instead of trusting client-provided patch text.
  if (body.owner && body.repo && body.pr?.number !== undefined) {
    const token = await readSession(req);
    if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    try {
      body = await loadPrInput(token, body.owner, body.repo, body.pr.number);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to load PR from GitHub" }, { status: 502 });
    }
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json(
      { error: "AI_GATEWAY_API_KEY is not configured" },
      { status: 500 },
    );
  }

  try {
    const result = streamText({
      model: process.env.AI_MODEL ?? "openai/gpt-5-mini",
      instructions: REVIEW_PROMPT,
      prompt: buildReviewPrompt(body),
      abortSignal: req.signal,
      output: Output.object({ schema: reviewSchema }),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Review failed" }, { status: 500 });
  }
}
