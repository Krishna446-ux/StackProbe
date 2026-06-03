export function Spinner() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 p-4">
            {/* The rotating ring */}
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-100" />

            <span className="text-xs text-zinc-400 font-medium animate-pulse">
                Processing request...
            </span>
        </div>
    );
}