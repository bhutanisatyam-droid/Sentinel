import { motion } from 'motion/react';
import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting for demo
  const highlightCode = (code: string) => {
    return code
      .replace(/(const|await|true|false)/g, '<span class="text-[#EDEDED]">$1</span>')
      .replace(/('.*?'|".*?")/g, '<span class="text-[#888888]">$1</span>')
      .replace(/(\{|\}|\(|\)|:)/g, '<span class="text-[#666666]">$1</span>');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[#222222] rounded bg-[#050505] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#222222]">
        <span className="text-xs text-[#888888] font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-xs text-[#888888] hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-xs font-mono text-[#888888] leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
        </pre>
      </div>
    </motion.div>
  );
}
