import { Link, NavLink, Outlet } from "react-router-dom";
import Footer from "components/Footer";
import "components/styles/Layout.css";

function Layout() {
  return (
    <div className="app-layout">
      <header className="top-nav">
        <div className="container">
          <Link to="/" className="top-nav-brand">
            Hiro Labs
          </Link>
          <nav className="top-nav-links">
            <NavLink to="/about">About</NavLink>
            <NavLink to="/demo">Book a Demo</NavLink>
          </nav>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
