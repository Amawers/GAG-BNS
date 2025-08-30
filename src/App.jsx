import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import InventoryPage from "../src/InventoryPage";
import LogsPage from "../src/LogsPage"
function Layout({ children }) {
  return (
    <div className="d-flex">
      {/* Sidebar */}
      <nav
        className="d-flex flex-column flex-shrink-0 p-3 text-white bg-success bg-gradient shadow"
        style={{ width: "260px", height: "100vh", borderTopRightRadius: "1rem" }}
      >
        {/* Brand */}
        <div className="d-flex align-items-center mb-4">
          <span className="fs-4 fw-bold">🌿 XACHI GAG BNS</span>
        </div>

        {/* Navigation */}
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-2">
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `nav-link fw-semibold rounded-pill px-3 py-2 ${
                  isActive ? "bg-white text-success shadow-sm" : "text-white"
                }`
              }
            >
              📦 Inventory
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/transaction"
              className={({ isActive }) =>
                `nav-link fw-semibold rounded-pill px-3 py-2 ${
                  isActive ? "bg-white text-success shadow-sm" : "text-white"
                }`
              }
            >
              💳 Transaction
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/reservation"
              className={({ isActive }) =>
                `nav-link fw-semibold rounded-pill px-3 py-2 ${
                  isActive ? "bg-white text-success shadow-sm" : "text-white"
                }`
              }
            >
              📝 Reservation
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/logs"
              className={({ isActive }) =>
                `nav-link fw-semibold rounded-pill px-3 py-2 ${
                  isActive ? "bg-white text-success shadow-sm" : "text-white"
                }`
              }
            >
              📜 Logs
            </NavLink>
          </li>
        </ul>

        {/* Footer */}
        <hr className="text-light" />
        <div className="small">© 2025 My App</div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1 p-4 bg-light" style={{ minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}

// Placeholder Pages
const TransactionPage = () => <div>💳 Transaction Page</div>;
const ReservationPage = () => <div>📝 Reservation Page</div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/inventory"
          element={
            <Layout>
              <InventoryPage />
            </Layout>
          }
        />
        <Route
          path="/transaction"
          element={
            <Layout>
              <TransactionPage />
            </Layout>
          }
        />
        <Route
          path="/reservation"
          element={
            <Layout>
              <ReservationPage />
            </Layout>
          }
        />
        <Route
          path="/logs"
          element={
            <Layout>
              <LogsPage />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/inventory" />} />
      </Routes>
    </BrowserRouter>
  );
}
