"use client";
import React, { useState } from 'react';
import { X, Copy, Check, Code, Globe, Layers } from 'lucide-react';
import { MushiConfig } from '@/lib/dendenmushi/mushi';

interface Props {
  config: MushiConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedModal: React.FC<Props> = ({ config, isOpen, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dendenmushi.app';

  const iframeSnippet = `<iframe 
  src="${currentUrl}?seed=${config.seed}&embed=true" 
  width="450" 
  height="650" 
  style="border:none; border-radius: 16px; overflow:hidden;"
  allow="microphone"
  title="3D Den Den Mushi Communicator"
></iframe>`;

  const webComponentSnippet = `<script type="module" src="${currentUrl}/embed.js"></script>

<den-den-mushi 
  seed="${config.seed}" 
  region="${config.region}" 
  theme="dark">
</den-den-mushi>`;

  const reactSnippet = `import { DenDenMushiWidget } from 'den-den-mushi-3d';

export default function MySite() {
  return (
    <DenDenMushiWidget 
      seed="${config.seed}"
      onVoiceMessage={(text) => console.log('Mushi said:', text)}
    />
  );
}`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020b12]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#fcf8f0] border-2 border-[#b8860b] rounded-lg max-w-2xl w-full p-6 space-y-4 text-[#172b31] shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#52636a] hover:text-[#bd3c32] transition cursor-pointer font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#c8aa6d]/60 pb-3">
          <div className="w-10 h-10 rounded-lg bg-[#d49b38] text-[#12242e] flex items-center justify-center font-bold text-xl shadow-xs">
            🐌
          </div>
          <div>
            <h2 className="font-serif font-extrabold text-lg text-[#172b31]">
              Connect 3D Den Den Mushi to Any Site
            </h2>
            <p className="text-xs text-[#52636a] font-mono">
              Copy code snippets below to embed Transponder Snail #{config.seed} into external web applications.
            </p>
          </div>
        </div>

        {/* IFRAME EMBED */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#172b31] font-mono">
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#b8860b]" /> 1. Standard HTML iFrame Embed
            </span>
            <button
              onClick={() => copyToClipboard(iframeSnippet, 'iframe')}
              className="text-[#12242e] hover:bg-[#c08828] flex items-center gap-1 cursor-pointer bg-[#d49b38] px-2.5 py-1 rounded text-xs font-bold border border-[#a67520] shadow-2xs"
            >
              {copiedType === 'iframe' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'iframe' ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="bg-[#102430] text-[#f4ead5] p-3 rounded text-xs font-mono overflow-x-auto border border-[#c8aa6d]/50 shadow-inner">
            {iframeSnippet}
          </pre>
        </div>

        {/* WEB COMPONENT */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#172b31] font-mono">
            <span className="flex items-center gap-1.5">
              <Code className="w-4 h-4 text-[#b8860b]" /> 2. Custom Web Component (&lt;den-den-mushi&gt;)
            </span>
            <button
              onClick={() => copyToClipboard(webComponentSnippet, 'webcomponent')}
              className="text-[#12242e] hover:bg-[#c08828] flex items-center gap-1 cursor-pointer bg-[#d49b38] px-2.5 py-1 rounded text-xs font-bold border border-[#a67520] shadow-2xs"
            >
              {copiedType === 'webcomponent' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'webcomponent' ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="bg-[#102430] text-[#f4ead5] p-3 rounded text-xs font-mono overflow-x-auto border border-[#c8aa6d]/50 shadow-inner">
            {webComponentSnippet}
          </pre>
        </div>

        {/* REACT COMPONENT */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#172b31] font-mono">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#b8860b]" /> 3. React / Next.js Component Import
            </span>
            <button
              onClick={() => copyToClipboard(reactSnippet, 'react')}
              className="text-[#12242e] hover:bg-[#c08828] flex items-center gap-1 cursor-pointer bg-[#d49b38] px-2.5 py-1 rounded text-xs font-bold border border-[#a67520] shadow-2xs"
            >
              {copiedType === 'react' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'react' ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="bg-[#102430] text-[#f4ead5] p-3 rounded text-xs font-mono overflow-x-auto border border-[#c8aa6d]/50 shadow-inner">
            {reactSnippet}
          </pre>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="bg-[#ebdcc4] hover:bg-[#dfcdb2] text-[#172b31] font-bold px-4 py-1.5 rounded border border-[#c9aa6d] text-xs cursor-pointer"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
};

