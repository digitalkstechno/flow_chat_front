import React, { useEffect } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmModal({
    isOpen,
    message,
    onConfirm,
    onCancel,
    title = "Are you sure?",
    confirmText = "Delete",
    cancelText = "Cancel"
}: ConfirmModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="bg-white dark:bg-[#0f0f1c] rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-zinc-800/80">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 px-2">{message}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={onCancel} 
                        className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
