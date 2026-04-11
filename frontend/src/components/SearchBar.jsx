import { useState } from "react";

const initialFilters = {
  keyword: "",
  location: "",
  type: "",
  locationType: "",
  skill: "",
};

export default function SearchBar({ onSearch, loading = false }) {
  const [filters, setFilters] = useState(initialFilters);

  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = () => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value.trim() !== "")
    );

    onSearch?.(cleanedFilters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    onSearch?.({});
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        <input
          name="keyword"
          value={filters.keyword}
          onChange={handleChange}
          placeholder="Job title, keywords..."
          className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
        />

        <input
          name="location"
          value={filters.location}
          onChange={handleChange}
          placeholder="Location..."
          className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
        />

        <select
          name="type"
          value={filters.type}
          onChange={handleChange}
          className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">All job types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
          <option value="contract">Contract</option>
        </select>

        <select
          name="locationType"
          value={filters.locationType}
          onChange={handleChange}
          className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">All work modes</option>
          <option value="remote">Remote</option>
          <option value="onsite">Onsite</option>
          <option value="hybrid">Hybrid</option>
        </select>

        <input
          name="skill"
          value={filters.skill}
          onChange={handleChange}
          placeholder="Skill e.g. react"
          className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>

        <button
          onClick={handleReset}
          type="button"
          className="rounded-2xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-200"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
