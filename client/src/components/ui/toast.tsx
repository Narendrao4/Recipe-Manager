import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import Button from './button';
import { cn } from '../../lib/utils';

type ToastTone = 'success' | 'error' | 'info';

interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
}

interface Toast extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClasses: Record<ToastTone, string> = {
  success:
    'border-emerald-200 bg-white text-forest shadow-emerald-950/10 dark:border-emerald-400/30 dark:bg-forest-dark dark:text-cream dark:shadow-black/20',
  error:
    'border-red-200 bg-white text-forest shadow-red-950/10 dark:border-red-400/30 dark:bg-forest-dark dark:text-cream dark:shadow-black/20',
  info:
    'border-forest/10 bg-white text-forest shadow-forest/10 dark:border-cream/15 dark:bg-forest-dark dark:text-cream dark:shadow-black/20',
};

const toneIconClasses: Record<ToastTone, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
  error: 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-200',
  info: 'bg-terracotta/10 text-terracotta dark:bg-terracotta/20 dark:text-terracotta-light',
};

const toneIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} satisfies Record<ToastTone, typeof CheckCircle2>;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = Date.now();
      const nextToast: Toast = { id, tone: 'info', ...options };
      setToasts((current) => [nextToast, ...current].slice(0, 3));
      window.setTimeout(() => removeToast(id), 3600);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed left-1/2 top-5 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-3">
        {toasts.map((item) => {
          const tone = item.tone || 'info';
          const Icon = toneIcons[tone];

          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur animate-toast-in',
                toneClasses[tone]
              )}
            >
              <div className={cn('mt-0.5 rounded-full p-1', toneIconClasses[tone])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{item.title}</div>
                {item.description && (
                  <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                    {item.description}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-cream/10"
                onClick={() => removeToast(item.id)}
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
};
