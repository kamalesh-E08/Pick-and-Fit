export default function ProfileLoading() {
  return (
    <div className="container flex items-center justify-center py-10 px-4 min-h-[calc(100vh-14rem)]">
      <div className="w-full max-w-2xl space-y-4">
        <div className="h-7 w-40 bg-muted animate-pulse rounded" />
        <div className="grid gap-4">
          <div className="h-36 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-muted animate-pulse rounded" />
            <div className="h-40 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
