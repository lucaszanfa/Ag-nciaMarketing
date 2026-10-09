import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <span className="text-sm font-semibold">Marketing AI Studio</span>
        </div>
        {children}
      </div>
    </div>
  );
}
