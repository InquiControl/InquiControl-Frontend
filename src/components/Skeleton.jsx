export function SkeletonLine({ width = "100%", height = 14 }) {
  return <span className="skeleton" style={{ width, height, display: "block" }} />;
}

export function SkeletonTable({ rows = 4, columns = 4 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, r) => (
        <div className="skeleton-table__row" key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <SkeletonLine key={c} width={c === 0 ? "70%" : "90%"} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3 }) {
  return (
    <div className="skeleton-cards">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <SkeletonLine width="55%" height={18} />
          <SkeletonLine width="80%" />
          <SkeletonLine width="40%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="stat-card" key={i}>
          <SkeletonLine width="60%" />
          <div style={{ height: 8 }} />
          <SkeletonLine width="40%" height={22} />
        </div>
      ))}
    </div>
  );
}
