import React from 'react';
import { Copy, Check, Eye, ExternalLink } from 'lucide-react';

interface SandboxEndpoint {
    title: string;
    description: string;
    path: string;
    responseExample: string;
    params?: { name: string; description: string }[];
}

interface ApiSandboxTabProps {
    slug: string;
    apiUrl: string;
    displayImageHost: string;
    testPhone: string;
    testPerson: string;
    testDoc: string;
    copiedIndex: number | null;
    copyToClipboard: (text: string, index: number) => void;
}

export default function ApiSandboxTab({
    slug,
    apiUrl,
    displayImageHost,
    testPhone,
    testPerson,
    testDoc,
    copiedIndex,
    copyToClipboard
}: ApiSandboxTabProps) {

    const sandboxEndpoints: SandboxEndpoint[] = [
        {
            title: '1. Retrieve Sections (Family Groups)',
            description: 'Returns family sections/groups for a client. WhatsApp uses this to partition lists within the 10-row limit.',
            path: `/sections/${slug}/${testPhone}`,
            responseExample: `{
  "sections": [
    { "id": 1, "name": "Family Group 1" }
  ]
}`
        },
        {
            title: '2. Retrieve Group Members',
            description: 'Returns client and family members for a specific family group/section.',
            path: `/members/${slug}/${testPhone}/Family Group 1`,
            params: [
                { name: 'sectionId', description: 'Section name (e.g. "Family Group 1") or index ("1").' }
            ],
            responseExample: `{
  "members": [
    { "id": 1, "name": "${testPerson}" }
  ]
}`
        },
        {
            title: '3. Retrieve Document Groups',
            description: 'Retrieves client document categories grouped in batches of 10 to fit WhatsApp list boundaries.',
            path: `/docsections/${slug}/${testPhone}/${encodeURIComponent(testPerson)}`,
            responseExample: `{
  "sections": [
    { "id": 1, "name": "Document Group 1" },
    { "id": 2, "name": "Document Group 2" }
  ]
}`
        },
        {
            title: '4. Retrieve Document Categories List',
            description: 'Lists document categories inside a selected Document Group.',
            path: `/docslist/${slug}/${testPhone}/${encodeURIComponent(testPerson)}/Document Group 1`,
            params: [
                { name: 'sectionId', description: 'Document group name (e.g. "Document Group 1").' }
            ],
            responseExample: `{
  "categories": [
    { "id": 1, "name": "PAN Card" },
    { "id": 2, "name": "Aadhar Card" }
  ]
}`
        },
        {
            title: '5. Download Document Link',
            description: 'Validates target category, fetches matching file from backend, and redirects to the public file server.',
            path: `/docs/${slug}/${testPhone}/${encodeURIComponent(testPerson)}/${encodeURIComponent(testDoc)}`,
            params: [
                { name: 'doc', description: 'Target document category (e.g., "ITR = 2024-2025").' }
            ],
            responseExample: `{
  "category": "GST Certificate",
  "subCategory": "",
  "filePath": "${displayImageHost || 'http://localhost:5000/api'}/uploads/digitalks/document.pdf"
}`
        }
    ];

    return (
        <div className="space-y-6 max-w-4xl">

            {/* API Endpoint Banner */}
            <div className="bg-neutral-50 dark:bg-neutral-900/60 border border-border p-4.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex items-center justify-center w-6 h-6 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 font-bold rounded-lg text-xs shrink-0">GET</span>
                    <span className="font-mono truncate select-all text-neutral-600 dark:text-neutral-350">
                        <strong>Sandbox Endpoint Base:</strong> {apiUrl || 'Loading API base URL...'}
                    </span>
                </div>
            </div>

            {/* Endpoints listing */}
            <div className="space-y-6">
                {sandboxEndpoints.map((endpoint, idx) => {
                    const fullUrl = `${apiUrl}${endpoint.path}`;

                    return (
                        <div key={idx} className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs flex flex-col hover:border-emerald-500/20 dark:hover:border-emerald-500/10 transition-all">
                            <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-sm text-foreground">{endpoint.title}</h3>
                                    <p className="text-xs text-neutral-550 dark:text-neutral-400 leading-relaxed font-normal">{endpoint.description}</p>
                                </div>

                                {endpoint.params && (
                                    <div className="space-y-2 bg-neutral-50/40 dark:bg-[#181825]/30 p-3 rounded-xl border border-border">
                                        <p className="text-[9px] font-black text-neutral-450 uppercase tracking-widest leading-none">Path Variables</p>
                                        <div className="space-y-1.5">
                                            {endpoint.params.map((p, k) => (
                                                <p key={k} className="text-xs leading-normal text-slate-800 dark:text-slate-200 font-medium">
                                                    <code className="text-[11px] font-mono text-emerald-650 dark:text-emerald-455 font-bold bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">{p.name}</code> &mdash; <span className="text-neutral-550 dark:text-neutral-400">{p.description}</span>
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* API URL Display */}
                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black text-neutral-450 uppercase tracking-widest leading-none">Endpoint URL</p>
                                    <div className="relative flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900 border border-border px-3.5 py-2.5 rounded-xl text-xs font-mono text-neutral-700 dark:text-neutral-350">
                                        <span className="truncate select-all pr-12 font-medium">{fullUrl}</span>
                                        <button onClick={() => copyToClipboard(fullUrl, idx)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-emerald-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                            title="Copy URL">
                                            {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Response JSON details */}
                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black text-neutral-455 uppercase tracking-widest leading-none">Response Schema Schema</p>
                                    <pre className="p-4 bg-neutral-950 border border-neutral-900 text-neutral-300 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed shadow-inner">{endpoint.responseExample}</pre>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-950/20 border-t border-border flex items-center justify-end">
                                <a href={fullUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-655 dark:text-emerald-400 hover:underline">
                                    <Eye className="w-3.5 h-3.5" /> Invoke Link Endpoint <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
