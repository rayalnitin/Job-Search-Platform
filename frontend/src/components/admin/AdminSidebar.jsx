const sections = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "logs", label: "Audit Logs" },
];

export default function AdminSidebar({ activeSection, onChange }) {
  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-slate-200 bg-slate-50 pt-20 md:block">
      <div className="p-4">
        <h2 className="mb-6 font-bold text-slate-900">Admin Panel</h2>
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
