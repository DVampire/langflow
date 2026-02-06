import { useState } from "react";
import Markdown from "react-markdown";
import rehypeMathjax from "rehype-mathjax/browser";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { EMPTY_OUTPUT_SEND_MESSAGE } from "@/constants/constants";
import { extractLanguage, isCodeBlock } from "@/utils/codeBlockUtils";
import { preprocessChatMessage } from "@/utils/markdownUtils";
import { cn } from "@/utils/utils";
import CodeTabsComponent from "../../../../../../components/core/codeTabsComponent";

type MarkdownFieldProps = {
  chat: any;
  isEmpty: boolean;
  chatMessage: string;
  editedFlag: React.ReactNode;
  isAudioMessage?: boolean;
};

/**
 * Embedded iframe renderer for displaying web content inline.
 * Supports opening in a new tab and fullscreen toggle.
 */
const IframeRenderer = (props: any) => {
  const { src, title, width, height, ...rest } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  if (!src) return null;

  const iframeHeight = height || "600";
  const iframeTitle = title || src;

  return (
    <div
      className={cn(
        "my-3 w-full overflow-hidden rounded-xl border border-border/60 bg-background shadow-lg",
        isExpanded && "fixed inset-4 z-[9999] my-0 rounded-2xl",
      )}
    >
      {/* Title bar */}
      <div className="flex h-9 items-center justify-between border-b border-border/60 bg-muted/50 px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {iframeTitle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title={isExpanded ? "Exit fullscreen" : "Fullscreen"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isExpanded ? (
                <>
                  <path d="M8 3v3a2 2 0 01-2 2H3" />
                  <path d="M21 8h-3a2 2 0 01-2-2V3" />
                  <path d="M3 16h3a2 2 0 012 2v3" />
                  <path d="M16 21v-3a2 2 0 012-2h3" />
                </>
              ) : (
                <>
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </>
              )}
            </svg>
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Open in new tab"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
      {/* Iframe */}
      <iframe
        src={src}
        title={iframeTitle}
        width="100%"
        height={isExpanded ? "100%" : iframeHeight}
        style={{
          border: "none",
          display: "block",
          minHeight: isExpanded ? "calc(100% - 36px)" : `${iframeHeight}px`,
        }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        loading="lazy"
      />
    </div>
  );
};

export const MarkdownField = ({
  chat,
  isEmpty,
  chatMessage,
  editedFlag,
  isAudioMessage,
}: MarkdownFieldProps) => {
  // Process the chat message to handle <think> tags and clean up tables
  const processedChatMessage = preprocessChatMessage(chatMessage);

  return (
    <div className="w-full items-baseline gap-2">
      <Markdown
        remarkPlugins={[remarkGfm as any]}
        rehypePlugins={[rehypeMathjax, rehypeRaw]}
        className={cn(
          "markdown prose flex w-full max-w-full flex-col items-baseline text-sm font-normal word-break-break-word dark:prose-invert",
          isEmpty ? "text-muted-foreground" : "text-primary",
        )}
        components={{
          iframe: IframeRenderer,
          p({ node, ...props }) {
            return (
              <p className="w-fit max-w-full my-1.5 last:mb-0 first:mt-0">
                {props.children}
              </p>
            );
          },
          ol({ node, ...props }) {
            return <ol className="max-w-full">{props.children}</ol>;
          },
          ul({ node, ...props }) {
            return <ul className="max-w-full mb-2">{props.children}</ul>;
          },
          pre({ node, ...props }) {
            return <>{props.children}</>;
          },
          hr({ node, ...props }) {
            return <hr className="w-full mt-3 mb-5 border-border" {...props} />;
          },
          h3({ node, ...props }) {
            return <h3 className={cn("mt-4", props.className)} {...props} />;
          },
          table: ({ node, ...props }) => {
            return (
              <div className="max-w-full overflow-hidden rounded-md border bg-muted">
                <div className="max-h-[600px] w-full overflow-auto p-4">
                  <table className="!my-0 w-full">{props.children}</table>
                </div>
              </div>
            );
          },
          code: ({ node, className, children, ...props }) => {
            let content = children as string;
            if (
              Array.isArray(children) &&
              children.length === 1 &&
              typeof children[0] === "string"
            ) {
              content = children[0] as string;
            }
            if (typeof content === "string") {
              if (content.length) {
                if (content[0] === "▍") {
                  return <span className="form-modal-markdown-span"></span>;
                }

                // Specifically handle <think> tags that were wrapped in backticks
                if (content === "<think>" || content === "</think>") {
                  return <span>{content}</span>;
                }
              }

              if (isCodeBlock(className, props, content)) {
                return (
                  <CodeTabsComponent
                    language={extractLanguage(className)}
                    code={String(content).replace(/\n$/, "")}
                  />
                );
              }

              return (
                <code className={className} {...props}>
                  {content}
                </code>
              );
            }
          },
        }}
      >
        {isEmpty && !chat.stream_url
          ? EMPTY_OUTPUT_SEND_MESSAGE
          : processedChatMessage}
      </Markdown>
      {editedFlag}
    </div>
  );
};
