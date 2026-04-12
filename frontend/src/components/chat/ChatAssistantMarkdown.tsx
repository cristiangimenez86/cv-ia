"use client";

import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { ReactNode } from "react";
import { normalizeCvSectionHref, parseCvPdfChatLink } from "@/lib/cvChatLink";
import { downloadCvPdfClient } from "@/lib/cvPdfDownload";

type ChatAssistantMarkdownProps = {
  content: string;
  locale: string;
  onClose: () => void;
};

/**
 * Renders assistant chat content as GFM Markdown with XSS sanitization, safe in-app section links, and CV PDF API links.
 */
const CHAT_API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export function ChatAssistantMarkdown({
  content,
  locale,
  onClose,
}: ChatAssistantMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: ({ href, children }) => (
          <AssistantLink href={href} locale={locale} onClose={onClose}>
            {children}
          </AssistantLink>
        ),
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-2 list-disc pl-4 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal pl-4 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ className, children, ...props }) => {
          const isBlock = Boolean(className?.includes("language-"));
          if (isBlock) {
            return (
              <code
                className={`block font-mono text-xs text-foreground ${className ?? ""}`}
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className="rounded bg-surface px-1 py-0.5 font-mono text-[0.85em] text-foreground"
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-lg border border-border bg-surface p-3 text-xs last:mb-0">
            {children}
          </pre>
        ),
        h1: ({ children }) => (
          <h4 className="mb-2 mt-3 font-semibold text-foreground first:mt-0">
            {children}
          </h4>
        ),
        h2: ({ children }) => (
          <h4 className="mb-2 mt-3 font-semibold text-foreground first:mt-0">
            {children}
          </h4>
        ),
        h3: ({ children }) => (
          <h4 className="mb-2 mt-3 font-semibold text-foreground first:mt-0">
            {children}
          </h4>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-primary/50 pl-3 text-muted last:mb-0">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-border" />,
        table: ({ children }) => (
          <div className="mb-2 max-w-full overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead>{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
        th: ({ children }) => (
          <th className="border border-border px-2 py-1.5 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-2 py-1.5">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function AssistantLink({
  href,
  children,
  locale,
  onClose,
}: {
  href?: string;
  children?: ReactNode;
  locale: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const pdf = parseCvPdfChatLink(href);
  if (pdf) {
    const fetchUrl = CHAT_API_BASE_URL
      ? `${CHAT_API_BASE_URL}${pdf.fetchPath}`
      : pdf.fetchPath;
    const accessToken = CHAT_API_BASE_URL
      ? (process.env.NEXT_PUBLIC_API_ACCESS_TOKEN ?? "").trim()
      : "";

    return (
      <button
        type="button"
        className="inline cursor-pointer border-0 bg-transparent p-0 text-left font-medium text-primary underline underline-offset-2 hover:opacity-90"
        onClick={() => {
          void (async () => {
            await downloadCvPdfClient(
              fetchUrl,
              `cv-${pdf.lang}`,
              accessToken || undefined,
            );
          })();
        }}
      >
        {children}
      </button>
    );
  }

  const normalized = normalizeCvSectionHref(href, locale);
  if (!normalized) {
    return <span className="text-foreground">{children}</span>;
  }

  return (
    <a
      href={normalized}
      className="font-medium text-primary underline underline-offset-2 hover:opacity-90"
      onClick={(e) => {
        e.preventDefault();
        onClose();
        router.push(normalized);
      }}
    >
      {children}
    </a>
  );
}
