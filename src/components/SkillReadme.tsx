"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

interface SkillReadmeProps {
  content: string;
  skillTitle: string;
}

export function SkillReadme({ content, skillTitle }: SkillReadmeProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-5 py-3 border-b border-[#1e1e2e] flex items-center justify-between hover:bg-[#0e0e16] transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-[#177CB0]" />
          <span className="text-sm font-semibold text-[#f8f8ff]">skills.md</span>
          <span className="text-xs text-[#4a4a5a]">{skillTitle}</span>
        </div>
        {collapsed ? (
          <ChevronDown size={15} className="text-[#8b8ba7]" />
        ) : (
          <ChevronUp size={15} className="text-[#8b8ba7]" />
        )}
      </button>

      {!collapsed && (
        <div className="px-6 py-5 prose prose-invert prose-sm max-w-none
          [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-[#f8f8ff] [&_h1]:mb-3 [&_h1]:mt-0
          [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-[#f8f8ff] [&_h2]:mt-5 [&_h2]:mb-2
          [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-[#8b8ba7] [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:mt-4 [&_h3]:mb-1.5
          [&_p]:text-[#8b8ba7] [&_p]:leading-relaxed [&_p]:text-sm [&_p]:mb-3
          [&_ul]:space-y-1 [&_ul]:pl-4 [&_ul]:mb-3
          [&_li]:text-[#8b8ba7] [&_li]:text-sm [&_li]:list-disc [&_li]:marker:text-[#177CB0]
          [&_strong]:text-[#f8f8ff] [&_strong]:font-semibold
          [&_code]:text-[#4B5CC4] [&_code]:bg-[#1e1e2e] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
          [&_pre]:bg-[#0e0e16] [&_pre]:border [&_pre]:border-[#1e1e2e] [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:mb-4
          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[#4B5CC4]
          [&_hr]:border-[#1e1e2e] [&_hr]:my-4
          [&_a]:text-[#177CB0] [&_a]:no-underline [&_a:hover]:underline
        ">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
