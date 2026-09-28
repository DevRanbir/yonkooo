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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-5 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xl">
            🐌
          </div>
          <div>
            <h2 className="font-nautical font-bold text-lg text-amber-300">
              Connect 3D Den Den Mushi to Any Site
            </h2>
            <p className="text-xs text-slate-400">
              Copy code snippets below to embed Mushi #{config.seed} into external web applications.
            </p>
          </div>
        </div>

        {/* IFRAME EMBED */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4" /> 1. Standard HTML iFrame Embed
            </span>
            <button
              onClick={() => copyToClipboard(iframeSnippet, 'iframe')}
              className="text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer bg-slate-800 px-2.5 py-1 rounded-lg border border-amber-500/30"
            >
              {copiedType === 'iframe' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'iframe' ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 text-slate-300 p-3 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
            {iframeSnippet}
          </pre>
        </div>

        {/* WEB COMPONENT */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span className="flex items-center gap-1.5">
              <Code className="w-4 h-4" /> 2. Custom Web Component (&lt;den-den-mushi&gt;)
            </span>
            <button
              onClick={() => copyToClipboard(webComponentSnippet, 'webcomponent')}
              className="text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer bg-slate-800 px-2.5 py-1 rounded-lg border border-amber-500/30"
            >
              {copiedType === 'webcomponent' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'webcomponent' ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 text-slate-300 p-3 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
            {webComponentSnippet}
          </pre>
        </div>

        {/* REACT COMPONENT */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> 3. React / Next.js Component Import
            </span>
            <button
              onClick={() => copyToClipboard(reactSnippet, 'react')}
              className="text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer bg-slate-800 px-2.5 py-1 rounded-lg border border-amber-500/30"
            >
              {copiedType === 'react' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'react' ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 text-slate-300 p-3 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
            {reactSnippet}
          </pre>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs sm:text-sm cursor-pointer"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
};

