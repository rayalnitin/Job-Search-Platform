import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}