import { NavLink, Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">Hiro Labs</div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>
            Home
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
