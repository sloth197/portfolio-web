"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import MarkdownImageWithFallback from "@/components/markdown-image-with-fallback";

type ProjectDescriptionProps = {
  markdown: string;
  githubUrl?: string | null;
};

export default function ProjectDescription({ markdown, githubUrl }: ProjectDescriptionProps) {
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const content = useMemo(() => {
    const englishStart = markdown.search(/^#{1,6}\s*(Overview|Key Features|Highlights|Tech Stack)\b/im);
    if (englishStart < 0) return markdown;
    return language === "ko" ? markdown.slice(0, englishStart).trim() : markdown.slice(englishStart).trim();
  }, [language, markdown]);

  return (
    <>
      <div className="project-description-toolbar" role="group" aria-label="Description language">
        <button type="button" className={language === "ko" ? "is-active" : ""} onClick={() => setLanguage("ko")}>KO</button>
        <button type="button" className={language === "en" ? "is-active" : ""} onClick={() => setLanguage("en")}>EN</button>
      </div>
      <div className="project-markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            img: ({ node, ...props }) => {
              void node;
              return <MarkdownImageWithFallback {...props} projectGithubUrl={githubUrl} />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </>
  );
}
