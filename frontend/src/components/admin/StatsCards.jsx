export default function StatsCards({ stats = [] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{stat.label}</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</h2>
          {stat.helper && <p className="mt-2 text-xs text-slate-400">{stat.helper}</p>}
        </div>
      ))}
    </div>
  );
}
