import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import CrisisButton from './CrisisButton';

export default function AppShell() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1 }}>
        {/* Persistent crisis button — top right on desktop */}
        <div style={{
          position: 'fixed', top: '1rem', right: '1.5rem', zIndex: 30,
        }}>
          <CrisisButton />
        </div>
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
