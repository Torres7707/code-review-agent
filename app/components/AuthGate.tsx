"use client";

export function AuthGate({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex h-[calc(100vh-3rem)] w-full flex-col items-center justify-center gap-8 bg-[var(--bg-base)] px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3">
          <span className="inline-block h-3 w-3 rounded-full bg-[var(--accent)]" />
          <h1 className="text-[22px] font-semibold tracking-tight">
            Code Review Agent
          </h1>
        </div>
        <p className="max-w-[440px] text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Sign in with GitHub, pick one of your repos and a pull request, and let
          the agent review the diff before you merge.
        </p>
      </div>

      <button
        type="button"
        onClick={onSignIn}
        className="group inline-flex items-center gap-2 rounded-md bg-[#24292f] px-4 py-2 text-[13px] text-white transition-colors hover:bg-[#2f363d] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="h-4 w-4"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
        </svg>
        Sign in with GitHub
      </button>

      <p className="text-[11px] text-[var(--text-muted)]">
        Reads your repos and open PRs · no code is stored · sign out any time
      </p>
    </div>
  );
}
