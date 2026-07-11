import React from 'react';
import { Smartphone, MessageSquare, Image, Video, FileText, ExternalLink } from 'lucide-react';

interface LivePreviewProps {
    headerFormat: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'NONE';
    headerText?: string;
    headerLink?: string;
    bodyText: string;
    footerText?: string;
    btnType: 'NONE' | 'QUICK_REPLY' | 'URL';
    quickReplies?: string[];
    ctaLabel?: string;
    ctaUrl?: string;
    previewParams?: string[];
    compact?: boolean;
}

export default function LivePreview({
    headerFormat,
    headerText,
    headerLink,
    bodyText,
    footerText,
    btnType,
    quickReplies = ['', '', ''],
    ctaLabel,
    ctaUrl,
    previewParams = [],
    compact = false
}: LivePreviewProps) {
    // Replace placeholders with preview parameter values
    const renderedBody = (() => {
        let text = bodyText || '';
        previewParams.forEach((val, idx) => {
            const placeholder = `{{${idx + 1}}}`;
            if (val) {
                text = text.replace(new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), val);
            }
        });
        return text;
    })();

    const renderedHeader = (() => {
        let text = headerText || '';
        previewParams.forEach((val, idx) => {
            const placeholder = `{{${idx + 1}}}`;
            if (val) {
                text = text.replace(new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), val);
            }
        });
        return text;
    })();

    const phoneFrame = (
        <div className="relative w-full max-w-[250px] aspect-[9/18] bg-neutral-900 dark:bg-black rounded-[2.5rem] border-[6px] border-neutral-800 dark:border-neutral-950 shadow-xl overflow-hidden ring-4 ring-neutral-100 dark:ring-neutral-900/30 shrink-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4.5 bg-neutral-800 dark:bg-neutral-950 rounded-b-xl z-10" />
            
            {/* Chat window */}
            <div className="h-full bg-[#e5ddd5] dark:bg-[#111111] flex flex-col">
                {/* Header info */}
                <div className="bg-[#075e54] dark:bg-[#1a1a1c] px-3.5 py-2 pt-6 flex items-center gap-2.5 border-b border-black/5">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white leading-none">CA Flow Notifications</p>
                        <p className="text-[8px] text-white/60 mt-0.5 font-semibold">online</p>
                    </div>
                </div>

                {/* Chat Bubble Container */}
                <div className="flex-1 p-3 overflow-y-auto">
                    <div className="inline-block w-full bg-white dark:bg-[#1e1e1e] rounded-2xl rounded-tl-none shadow-sm border border-neutral-150/40 dark:border-zinc-800/40 overflow-hidden">
                        {/* Image Header */}
                        {headerFormat === 'IMAGE' && (
                            <div className="w-full h-28 border-b border-border overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
                                {headerLink ? (
                                    <img src={headerLink} alt="Header Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 text-blue-600 dark:text-blue-450 text-[10px] font-bold">
                                        <Image className="w-5 h-5 animate-pulse" />
                                        <span>Image Attachment</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Video Header */}
                        {headerFormat === 'VIDEO' && (
                            <div className="w-full h-28 border-b border-border overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
                                {headerLink ? (
                                    <video src={headerLink} className="w-full h-full object-cover" autoPlay loop muted />
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 text-purple-650 dark:text-purple-400 text-[10px] font-bold">
                                        <Video className="w-5 h-5 animate-pulse" />
                                        <span>Video Attachment</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Document Header */}
                        {headerFormat === 'DOCUMENT' && (
                            <div className="w-full h-16 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-b border-border flex items-center justify-center shrink-0 px-3">
                                <div className="flex items-center gap-2 text-orange-655 dark:text-orange-400 text-[10px] font-bold min-w-0">
                                    <FileText className="w-5 h-5 shrink-0" />
                                    <span className="truncate max-w-[170px]">{headerLink ? headerLink.split('/').pop() : 'Document PDF'}</span>
                                </div>
                            </div>
                        )}

                        {/* Text Header */}
                        {headerFormat === 'TEXT' && renderedHeader.trim() && (
                            <div className="px-3 pt-3 pb-0">
                                <p className="font-bold text-xs text-neutral-800 dark:text-neutral-100 leading-snug">{renderedHeader}</p>
                            </div>
                        )}

                        {/* Body message content */}
                        <div className="px-3.5 py-3">
                            {renderedBody.trim() ? (
                                <pre className="whitespace-pre-wrap font-sans text-xs text-neutral-850 dark:text-neutral-250 leading-relaxed font-normal">{renderedBody}</pre>
                            ) : (
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic font-medium">No message body content...</span>
                            )}
                            {footerText && (
                                <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-2 font-medium border-t border-neutral-100 dark:border-zinc-800/40 pt-1.5 leading-normal">{footerText}</p>
                            )}
                            <p className="text-[8px] text-neutral-350 dark:text-neutral-500 text-right mt-1.5 font-bold uppercase tracking-wider">12:00 PM ✓✓</p>
                        </div>

                        {/* Quick Replies buttons */}
                        {btnType === 'QUICK_REPLY' && quickReplies.filter(Boolean).length > 0 && (
                            <div className="border-t border-neutral-100 dark:border-zinc-800/60 bg-neutral-50/50 dark:bg-[#1a1a1c] p-2 flex flex-col gap-1.5">
                                {quickReplies.filter(Boolean).map((btnText, i) => (
                                    <div key={i} className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-white dark:bg-[#252528] rounded-lg border border-neutral-200/60 dark:border-zinc-800 py-1.5 text-center shadow-sm select-none">
                                        {btnText}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* CTA Link button */}
                        {btnType === 'URL' && ctaLabel && (
                            <div className="border-t border-neutral-100 dark:border-zinc-800/60 bg-neutral-50/50 dark:bg-[#1a1a1c] p-2 text-center">
                                <span className="flex items-center justify-center gap-1.5 text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                                    <ExternalLink className="w-3 h-3" /> {ctaLabel}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (compact) {
        return phoneFrame;
    }

    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center">
            <div className="flex items-center gap-2.5 mb-5 w-full">
                <Smartphone className="w-5 h-5 text-neutral-400 shrink-0" />
                <span className="text-sm font-bold text-foreground">Interactive Preview</span>
            </div>
            {phoneFrame}
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center mt-3 leading-snug">
                Appearance may vary slightly by mobile client.
            </p>
        </div>
    );
}
