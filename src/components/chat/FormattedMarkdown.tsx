'use client';

import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown: **bold**, *italics*, `code`
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to match **bold**, *italics*, `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-[hsl(var(--foreground))]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-[hsl(var(--muted-foreground))]">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-mono text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function FormattedMarkdown({ content, className }: FormattedMarkdownProps) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // Horizontal divider (e.g., ───────────── or --- or ***)
        if (/^[─\-_*]{3,}$/.test(trimmed)) {
          return <hr key={lineIdx} className="my-2 border-t border-[hsl(var(--border))]" />;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={lineIdx} className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))] mt-2 mb-1">
              {renderInlineMarkdown(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={lineIdx} className="text-sm font-bold text-[hsl(var(--foreground))] mt-2 mb-1">
              {renderInlineMarkdown(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={lineIdx} className="text-base font-bold text-[hsl(var(--foreground))] mt-2 mb-1">
              {renderInlineMarkdown(trimmed.slice(2))}
            </h2>
          );
        }

        // List item (starts with • or - or *)
        if (/^[•\-*]\s+/.test(trimmed)) {
          const itemContent = trimmed.replace(/^[•\-*]\s+/, '');
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2">
              <span className="text-[hsl(var(--primary))] shrink-0 font-bold">•</span>
              <div className="flex-1 leading-relaxed">{renderInlineMarkdown(itemContent)}</div>
            </div>
          );
        }

        // Indented sub-bullets (starts with spaces then • or - or *)
        if (/^\s+[•\-*]\s+/.test(line)) {
          const itemContent = line.trim().replace(/^[•\-*]\s+/, '');
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-5">
              <span className="text-[hsl(var(--muted-foreground))] shrink-0">•</span>
              <div className="flex-1 leading-relaxed">{renderInlineMarkdown(itemContent)}</div>
            </div>
          );
        }

        // Standard paragraph line
        return (
          <p key={lineIdx} className="leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}
