export function PageContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const hasVerticalPadding = /\b(py-|pt-|pb-)/.test(className);
  return (
    <main className={`mx-auto w-full max-w-[1240px] px-5 lg:px-8${hasVerticalPadding ? "" : " py-12 lg:py-16"}${className ? ` ${className}` : ""}`}>
      {children}
    </main>
  );
}
