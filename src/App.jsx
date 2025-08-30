import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
	NavLink,
} from "react-router-dom";
import InventoryPage from "./InventoryPage";
import LogsPage from "./LogsPage";
import TransactionPage from "./TransactionPage";
import ReservationPage from "./ReservationPage";
import Dino from "../src/assets/tyrannosaurus.gif";
function Layout({ children }) {
	const navItems = [
		{ to: "/inventory", text: "📦 Inventory" },
		{ to: "/transaction", text: "💳 Transaction" },
		{ to: "/reservation", text: "📝 Reservation" },
		{ to: "/logs", text: "📜 Logs" },
	];

	return (
		<div className="d-flex flex-column flex-md-row min-vh-100">
			{/* Sidebar for Desktop */}
			<nav
				className="d-none d-md-flex flex-column flex-shrink-0 p-3 text-white bg-success bg-gradient shadow"
				style={{ width: "260px", borderTopRightRadius: "1rem" }}
			>
				<div className="d-flex align-items-center mb-4">
  <span
    style={{
      fontFamily: "cursive",
      fontSize: "1.8rem",
      fontWeight: "bold",
      position: "relative",
      color: "white",
    }}
  >
     🌿GAG BNS
    <span
      style={{
        content: '""',
        position: "absolute",
        bottom: "-4px",
        left: "0",
        width: "110%",
        height: "3px",
        background: "linear-gradient(to right, #28a745, #a8e6a2)",
        borderRadius: "2px",
      }}
    ></span>
  </span>
</div>


				<ul className="nav nav-pills flex-column mb-auto">
					{navItems.map((item) => (
						<li key={item.to} className="nav-item mb-2">
							<NavLink
								to={item.to}
								className={({ isActive }) =>
									`nav-link fw-semibold rounded-pill px-3 py-2 d-flex justify-content-between align-items-center ${
										isActive
											? "bg-white text-success shadow-sm"
											: "text-white"
									}`
								}
							>
								<span>{item.text}</span>
								{window.location.pathname === item.to && (
									<img
										src={Dino}
										alt="dino gif"
										style={{
											width: "30px",
											height: "auto",
										}}
									/>
								)}
							</NavLink>
						</li>
					))}
				</ul>
				<hr className="text-light" />
				<div className="small text-center">© 2025 Kongskie</div>
			</nav>

			{/* Main Content */}
			<main
				className="flex-grow-1 p-3 bg-light"
				style={{ minHeight: "100vh" }}
			>
				{children}
			</main>

			{/* Bottom Nav for Mobile Only */}
			<nav className="d-flex justify-content-around bg-success text-white shadow p-2 fixed-bottom d-md-none">
				{navItems.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						className={({ isActive }) =>
							`d-flex flex-column align-items-center text-decoration-none ${
								isActive ? "text-warning" : "text-white"
							}`
						}
					>
						<small>{item.text}</small>
					</NavLink>
				))}
			</nav>
		</div>
	);
}

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
