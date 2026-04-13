const sections = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "logs", label: "Audit Logs" },
  { id: "blockchain", label: "Blockchain" },
];

export default function AdminSidebar({ activeSection, onChange }) {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-slate-200 bg-slate-50/95 pt-4 backdrop-blur md:block">
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <div className="mb-6 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
          <h2 className="font-bold text-slate-900">Admin Panel</h2>
          <p className="mt-1 text-xs text-slate-500">Scroll-friendly navigation</p>
        </div>
        <div className="space-y-2 text-sm">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onChange?.(section.id)}
              className={`block w-full rounded-xl px-4 py-3 text-left font-medium transition-colors ${
                activeSection === section.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
