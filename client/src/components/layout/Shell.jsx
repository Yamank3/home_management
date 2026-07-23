import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';

export default function Shell({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
