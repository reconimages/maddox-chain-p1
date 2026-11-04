export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-sm">
      {message}
    </div>
  );
}