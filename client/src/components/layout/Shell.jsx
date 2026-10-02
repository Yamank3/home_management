import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import VoiceCommand from '../VoiceCommand.jsx';
import { RemindersProvider } from '../../context/RemindersContext.jsx';

export default function Shell({ children }) {
  return (
    <RemindersProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 pt-safe pb-32 md:pb-0">
          {children}
        </main>
        <BottomNav />
        <VoiceCommand />
      </div>
    </RemindersProvider>
  );
}
