export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white shadow rounded p-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children }) {
  return <div className="mt-2">{children}</div>;
}
