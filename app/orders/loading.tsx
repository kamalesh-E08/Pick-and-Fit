export default function OrdersLoading() {
  return (
    <div className="container flex items-center justify-center py-10 px-4 min-h-[calc(100vh-14rem)]">
      <div className="w-full max-w-2xl space-y-4">
        <div className="h-7 w-40 bg-muted animate-pulse rounded" />
        <div className="h-20 bg-muted animate-pulse rounded" />
        <div className="h-20 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}
