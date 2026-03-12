"use client";

import { KeyboardEvent, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

type BlockStyle = "p" | "h1" | "h2" | "h3";

type Props = {
  id: string;
  value: string;
  onValueChange: (next: string) => void;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
};

const SLASH_TO_STYLE: Record<string, BlockStyle> = {
  "/p": "p",
  "/h1": "h1",
  "/h2": "h2",
  "/h3": "h3",
};

function stylePrefix(style: BlockStyle): string {
  switch (style) {
    case "h1":
      return "# ";
    case "h2":
      return "## ";
    case "h3":
      return "### ";
    default:
      return "";
  }
}

function getLineRange(source: string, cursor: number): { start: number; end: number } {
  const start = source.lastIndexOf("\n", Math.max(0, cursor - 1)) + 1;
  const rawEnd = source.indexOf("\n", cursor);
  const end = rawEnd === -1 ? source.length : rawEnd;
  return { start, end };
}

function applyStyleToLine(source: string, cursor: number, style: BlockStyle): { next: string; cursor: number } {
  const { start, end } = getLineRange(source, cursor);
  const currentLine = source.slice(start, end);
  const leadingWhitespace = currentLine.match(/^\s*/)?.[0] ?? "";
  const contentWithoutHeading = currentLine.slice(leadingWhitespace.length).replace(/^#{1,3}\s+/, "");
  const prefix = stylePrefix(style);
  const updatedLine = `${leadingWhitespace}${prefix}${contentWithoutHeading}`;
  const next = `${source.slice(0, start)}${updatedLine}${source.slice(end)}`;
  const nextCursor = start + leadingWhitespace.length + prefix.length + contentWithoutHeading.length;
  return { next, cursor: nextCursor };
}

function convertSlashCommand(source: string, cursor: number): { next: string; cursor: number } | null {
  const { start } = getLineRange(source, cursor);
  const lineBeforeCursor = source.slice(start, cursor);
  const trimmed = lineBeforeCursor.trim();
  const style = SLASH_TO_STYLE[trimmed];
  if (!style) {
    return null;
  }

  const leadingWhitespace = lineBeforeCursor.match(/^\s*/)?.[0] ?? "";
  const prefix = stylePrefix(style);
  const next = `${source.slice(0, start)}${leadingWhitespace}${prefix}${source.slice(cursor)}`;
  const nextCursor = start + leadingWhitespace.length + prefix.length;
  return { next, cursor: nextCursor };
}

function insertAtCursor(source: string, start: number, end: number, inserted: string): { next: string; cursor: number } {
  const next = `${source.slice(0, start)}${inserted}${source.slice(end)}`;
  return { next, cursor: start + inserted.length };
}

export default function NotionMarkdownEditor({
  id,
  value,
  onValueChange,
  rows = 10,
  required = false,
  placeholder,
  maxLength,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingCursorRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingCursorRef.current === null || !textareaRef.current) {
      return;
    }
    const cursor = pendingCursorRef.current;
    textareaRef.current.selectionStart = cursor;
    textareaRef.current.selectionEnd = cursor;
    pendingCursorRef.current = null;
  }, [value]);

  function commit(nextValue: string, nextCursor: number) {
    pendingCursorRef.current = nextCursor;
    onValueChange(nextValue);
  }

  function applyStyle(style: BlockStyle) {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const result = applyStyleToLine(value, textarea.selectionStart, style);
    commit(result.next, result.cursor);
  }

  function insertSnippet(snippet: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const result = insertAtCursor(value, textarea.selectionStart, textarea.selectionEnd, snippet);
    commit(result.next, result.cursor);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const target = event.currentTarget;

    if (event.key === " ") {
      const slashResult = convertSlashCommand(value, target.selectionStart);
      if (slashResult) {
        event.preventDefault();
        commit(slashResult.next, slashResult.cursor);
        return;
      }
    }

    const modifierPressed = event.ctrlKey || event.metaKey;
    if (!modifierPressed || !event.altKey) {
      return;
    }

    if (event.key === "1") {
      event.preventDefault();
      applyStyle("h1");
      return;
    }
    if (event.key === "2") {
      event.preventDefault();
      applyStyle("h2");
      return;
    }
    if (event.key === "3") {
      event.preventDefault();
      applyStyle("h3");
      return;
    }
    if (event.key === "0") {
      event.preventDefault();
      applyStyle("p");
    }
  }

  return (
    <div className="notion-editor">
      <div className="notion-toolbar" aria-label="Block style shortcuts">
        <button type="button" className="btn-ghost notion-toolbar-btn" onClick={() => applyStyle("p")}>
          Paragraph
        </button>
        <button type="button" className="btn-ghost notion-toolbar-btn" onClick={() => applyStyle("h1")}>
          H1
        </button>
        <button type="button" className="btn-ghost notion-toolbar-btn" onClick={() => applyStyle("h2")}>
          H2
        </button>
        <button type="button" className="btn-ghost notion-toolbar-btn" onClick={() => applyStyle("h3")}>
          H3
        </button>
        <button type="button" className="btn-ghost notion-toolbar-btn" onClick={() => insertSnippet("\n")}>
          + Line
        </button>
        <button
          type="button"
          className="btn-ghost notion-toolbar-btn"
          onClick={() => insertSnippet("## Section Title\nWrite details here.\n\n")}
        >
          H2 Template
        </button>
      </div>

      <textarea
        ref={textareaRef}
        id={id}
        className="field-input notion-editor-input"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={onKeyDown}
        rows={rows}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
      />

      <p className="helper-text notion-editor-help">
        Enter adds line breaks as rendered. Use H1/H2/H3 buttons or slash commands for heading size.
      </p>
      <p className="helper-text notion-editor-help">
        Slash commands: <code>/h1</code>, <code>/h2</code>, <code>/h3</code>, <code>/p</code> + space | Shortcuts:
        <code>Ctrl/Cmd + Alt + 1/2/3/0</code>
      </p>

      <div className="project-markdown notion-editor-preview">
        {value.trim() ? (
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{value}</ReactMarkdown>
        ) : (
          <p className="helper-text" style={{ margin: 0 }}>
            Preview appears here while you type.
          </p>
        )}
      </div>
    </div>
  );
}
