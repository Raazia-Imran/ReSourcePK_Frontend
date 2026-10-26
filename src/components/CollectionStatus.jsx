export function CollectionStatus({ collection, emptyMessage }) {
  if (collection.loading)
    return <output className="collection-status">Loading records…</output>;
  if (collection.error)
    return (
      <div className="notice notice--error" role="alert">
        <p>{collection.error}</p>
        <button
          className="button button--quiet"
          type="button"
          onClick={collection.reload}
        >
          Try again
        </button>
      </div>
    );
  return collection.items.length ? null : (
    <p className="collection-empty">{emptyMessage}</p>
  );
}

export function Pagination({ collection }) {
  const pages = Math.max(1, Math.ceil(collection.total / collection.limit));
  if (pages < 2) return null;
  return (
    <nav className="pagination" aria-label="Record pages">
      <button
        className="button button--quiet"
        type="button"
        disabled={collection.loading || collection.page === 1}
        onClick={() => collection.changePage(collection.page - 1)}
      >
        Previous
      </button>
      <output>
        Page {collection.page} of {pages} · {collection.total} records
      </output>
      <button
        className="button button--quiet"
        type="button"
        disabled={collection.loading || collection.page >= pages}
        onClick={() => collection.changePage(collection.page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
