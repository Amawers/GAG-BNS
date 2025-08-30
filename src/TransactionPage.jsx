import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import ReservationConfirmationModal from "./components/ReservationConfirmationModal";
import SellConfirmationModal from "./components/SellConfirmationModal";
import Swal from "sweetalert2";
import supabase from "../config/supabase"


export default function TransactionPage() {
	const [cart, setCart] = useState([]);
	const [search, setSearch] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [showReservationModal, setShowReservationModal] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [products, setProducts] = useState([]); // store inventory

	// Fetch inventory from Supabase
	const fetchInventory = async () => {
		const { data, error } = await supabase
			.from("INVENTORY")
			.select("*")
			.order("last_updated", { ascending: false });
		if (!error) setProducts(data);
		else console.error("Fetch inventory error:", error);
	};

	useEffect(() => {
		fetchInventory();

		// Realtime listener for inventory changes
		const channel = supabase
			.channel("inventory-changes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "INVENTORY" },
				(payload) => {
					console.log("Realtime payload:", payload);
					if (
						["INSERT", "UPDATE", "DELETE"].includes(
							payload.eventType
						)
					) {
						fetchInventory(); // Refresh inventory on any change
					}
				}
			)
			.subscribe((status) => console.log("Channel status:", status));

		return () => supabase.removeChannel(channel);
	}, []);

	const grandTotal = cart.reduce(
		(sum, item) => sum + item.price_each * item.qty,
		0
	);

	const normalize = (str = "") =>
		str
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "") // remove accents
			.replace(/[^a-z0-9]/gi, ""); // keep only letters and numbers

	const handleSearch = (e) => {
		const value = e.target.value;
		setSearch(value);

		if (!value) {
			setSuggestions([]);
			return;
		}

		const cartAccounts = cart.map((item) => item.account_name);
		const searchNormalized = normalize(value);

		const filtered = products.filter((p) =>
			normalize(p.product_name).includes(searchNormalized)
		);

		const sorted = filtered.sort((a, b) => {
			const aInCart = cartAccounts.includes(a.account_name);
			const bInCart = cartAccounts.includes(b.account_name);

			if (aInCart && !bInCart) return -1;
			if (!aInCart && bInCart) return 1;
			return 0;
		});

		setSuggestions(sorted);
	};

	const addToCart = (product) => {
		const exists = cart.find((item) => item.id === product.id);
		if (exists) {
			setCart(
				cart.map((item) =>
					item.id === product.id
						? { ...item, qty: item.qty + 1 }
						: item
				)
			);
		} else {
			setCart([...cart, { ...product, qty: 1 }]);
		}
		setSearch("");
		setSuggestions([]);
	};

	const removeFromCart = (product) =>
		setCart(cart.filter((c) => c.id !== product.id));

	const updateQuantity = (productId, qty) => {
		if (qty < 1) return;
		const item = cart.find((c) => c.id === productId);
		if (!item) return;
		const maxQty = item.stocks;
		if (qty > maxQty) qty = maxQty;
		setCart(cart.map((c) => (c.id === productId ? { ...c, qty } : c)));
	};

	const clearCart = () => {
		Swal.fire({
			title: "Are you sure you want to clear the cart?",
			icon: "warning",
			showDenyButton: true,
			confirmButtonText: "Yes",
			denyButtonText: "No",
			confirmButtonColor: "#dc3545",
			denyButtonColor: "#6c757d",
		}).then((result) => {
			if (result.isConfirmed) {
				setCart([]);
				Swal.fire({
					toast: true,
					position: "top-end",
					icon: "success",
					title: "Cart cleared!",
					showConfirmButton: false,
					timer: 2000,
					timerProgressBar: true,
				});
			}
		});
	};

	const handleConfirmClick = () => setShowConfirmModal(true);

	return (
		<div className="container mt-4">
			<h2>Transaction Page</h2>

			<div className="row mt-4">
				{/* Product Input */}
				<div className="col-md-3">
					<h6>Input Product</h6>
					<input
						type="text"
						className="form-control mb-2"
						placeholder="Type product name..."
						value={search}
						onChange={handleSearch}
					/>

					{suggestions.length > 0 && (
						<ul
							className="list-group position-absolute"
							style={{
								zIndex: 10,
								width: "18%",
								maxHeight: "200px", // limit height
								overflowY: "auto", // scroll if too many items
							}}
						>
							{suggestions.map((p) => (
								<li
									key={p.id}
									className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
									onClick={() => addToCart(p)}
									style={{ cursor: "pointer" }}
								>
									<div>
										<strong>{p.product_name}</strong>
										<br />
										<small className="text-muted">
											{p.account_name}
										</small>
									</div>
									<span className="badge bg-primary">
										{p.stocks} Available
									</span>
								</li>
							))}
						</ul>
					)}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-start",
						}}
					>
						<small style={{ color: "black", fontWeight: "bold" }}>
							Direct Sheckles
						</small>
						<span
							style={{
								backgroundColor: "#d3d3d3",
								fontWeight: "bold",
								color: "black",
								padding: "2px 5px",
								borderRadius: "3px",
								cursor: "pointer",
							}}
							title="Click to copy"
							onClick={() =>
								navigator.clipboard.writeText(
									"1,000,000,000,000,000,000,000"
								)
							}
						>
							1,000,000,000,000,000,000,000
						</span>
					</div>
				</div>

				{/* Transaction Cart / Receipt */}
				<div className="col-md-9">
					<div
						className="card shadow p-3 d-flex flex-column"
						style={{ height: "450px" }}
					>
						<h4 className="text-center mb-2 text-uppercase">
							Current Transaction
						</h4>
						<p className="text-center mb-2">
							{new Date().toLocaleDateString()} -{" "}
							{new Date().toLocaleTimeString()}
						</p>
						<hr />
						{cart.length === 0 ? (
							<p className="text-center mt-5">No items added.</p>
						) : (
							<ul
								className="list-group mb-2 flex-grow-1"
								style={{
									maxHeight: "200px", // or adjust height as needed

									overflowY:
										cart.length > 3 ? "auto" : "visible",
								}}
							>
								{cart.map((item) => {
									const available = item.stocks - item.qty;
									return (
										<li
											key={item.id}
											className="list-group-item d-flex justify-content-between align-items-center"
										>
											<div className="d-flex flex-column gap-1">
												<div className="d-flex align-items-center gap-2">
													<strong>
														{item.product_name}
													</strong>
													<input
														type="number"
														value={item.qty}
														min={1}
														max={item.stocks}
														onChange={(e) =>
															updateQuantity(
																item.id,
																parseInt(
																	e.target
																		.value
																)
															)
														}
														className="form-control form-control-sm"
														style={{
															width: "60px",
														}}
													/>
													<span
														className={`badge ${
															available >= 0
																? "bg-success"
																: "bg-danger"
														}`}
													>
														{available >= 0
															? `Available: ${available}`
															: "No Stock"}
													</span>
												</div>
												<small className="text-muted">
													{item.account_name}
												</small>
											</div>
											<div className="d-flex align-items-center gap-2">
												{item.price_each && item.qty ? (
													<strong>
														₱
														{item.price_each *
															item.qty}
													</strong>
												) : null}

												<button
													className="btn btn-sm btn-danger"
													onClick={() =>
														removeFromCart(item)
													}
												>
													Remove
												</button>
											</div>
										</li>
									);
								})}
							</ul>
						)}
						<hr />
						<h5 className="text-end">Grand Total: ₱{grandTotal}</h5>
						<div className="mt-auto d-flex justify-content-between">
							<div className="d-flex gap-2">
								<button
									className="btn btn-warning fw-medium"
									style={{ minWidth: "100px" }}
									onClick={() =>
										setShowReservationModal(true)
									}
									disabled={cart.length === 0}
								>
									Reserve
								</button>
								<button
									className="btn btn-success fw-medium"
									style={{ minWidth: "100px" }}
									onClick={handleConfirmClick}
									disabled={cart.length === 0}
								>
									Sell
								</button>
							</div>
							<button
								className="btn btn-secondary fw-medium"
								style={{ minWidth: "100px" }}
								onClick={clearCart}
							>
								Clear cart
							</button>
						</div>
					</div>
				</div>
			</div>

			{showReservationModal && (
				<ReservationConfirmationModal
					cart={cart}
					grandTotal={grandTotal}
					onClose={() => setShowReservationModal(false)}
					onReserve={() => {
						setCart([]);
						setShowReservationModal(false);
					}}
				/>
			)}

			{showConfirmModal && (
				<SellConfirmationModal
					cart={cart.map((item) => ({
						product_name: item.product_name,
						qty: item.qty,
						price_each: item.price_each,
						account_name: item.account_name,
						user_name: item.user_name, // updated
					}))}
					grandTotal={grandTotal}
					onClose={() => setShowConfirmModal(false)}
					onConfirm={() => {
						setCart([]);
						setShowConfirmModal(false);
					}}
				/>
			)}
		</div>
	);
}
