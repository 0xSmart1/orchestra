export function Header({ title }: { title: string }) {
  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-6">
      <h2 className="text-sm font-medium">{title}</h2>
    </header>
  );
}
