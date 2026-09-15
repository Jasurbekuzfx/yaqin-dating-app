import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldAlert, CheckCircle2, DollarSign, LogOut } from 'lucide-react';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { VerificationsPage } from './pages/VerificationsPage.js';
import { PaymentsPage } from './pages/PaymentsPage.js';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('yaqin_admin_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('yaqin_admin_token');
    localStorage.removeItem('yaqin_admin_user');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Boshqaruv', icon: LayoutDashboard },
    { to: '/users', label: 'Foydalanuvchilar', icon: Users },
    { to: '/reports', label: 'Shikoyatlar', icon: ShieldAlert },
    { to: '/verifications', label: 'Verifikatsiya', icon: CheckCircle2 },
    { to: '/payments', label: 'Toʻlovlar', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Yon menyu (Sidebar) */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 px-3 py-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg">
              Y
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight">Yaqin Admin</h2>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">SuperAdmin</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut size={16} />
          <span>Tizimdan chiqish</span>
        </button>
      </aside>

      {/* Asosiy kontent */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedLayout>
            <UsersPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedLayout>
            <ReportsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/verifications"
        element={
          <ProtectedLayout>
            <VerificationsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedLayout>
            <PaymentsPage />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
