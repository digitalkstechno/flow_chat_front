import React, { createContext, useContext, useState, useRef } from 'react';
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
}

type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({ title: '', message: '' });
    const resolveRef = useRef<((value: boolean) => void) | undefined>(undefined);

    const confirm = (opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    };

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolveRef.current) resolveRef.current(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolveRef.current) resolveRef.current(false);
    };

    const variantColors = {
        danger: {
            bg: 'bg-red-50 dark:bg-red-950/20',
            text: 'text-red-650 dark:text-red-400',
            border: 'border-red-200 dark:border-red-900/40',
            button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/25',
            icon: AlertTriangle
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-950/20',
            text: 'text-amber-650 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-900/40',
            button: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/25',
            icon: AlertCircle
        },
        info: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/20',
            text: 'text-emerald-650 dark:text-emerald-400',
            border: 'border-emerald-250 dark:border-emerald-900/40',
            button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/25',
            icon: Info
        }
    };

    const selectedVariant = variantColors[options.variant || 'info'];
    const Icon = selectedVariant.icon;

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}>
                    
                    <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-border/80 p-6 shadow-2xl w-full max-w-sm relative flex flex-col items-center animate-scale-up text-center">
                        <button type="button" onClick={handleCancel}
                            className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-foreground dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                            <X className="w-4 h-4" />
                        </button>

                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${selectedVariant.bg} ${selectedVariant.text} ${selectedVariant.border} mb-4.5`}>
                            <Icon className="w-5.5 h-5.5" />
                        </div>

                        <h3 className="text-base font-bold text-foreground mb-1.5 leading-snug">
                            {options.title}
                        </h3>

                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6 max-w-[270px]">
                            {options.message}
                        </p>

                        <div className="flex items-center gap-3 w-full">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2.5 text-xs font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl transition-all"
                            >
                                {options.cancelLabel || 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className={`flex-1 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 ${selectedVariant.button}`}
                            >
                                {options.confirmLabel || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
