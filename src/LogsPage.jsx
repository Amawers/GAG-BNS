import { useState, useEffect } from "react";
import supabase from "../config/supabase";
import useSalesReport from "./hooks/useSalesReport";

export default function LogsPage() {
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [form, setForm] = useState({});
	const [search, setSearch] = useState("");
	const [filterDate, setFilterDate] = useState("");

	const fetchLogs = async () => {
		setLoading(true);

		const { data, error } = await supabase
			.from("LOG")
			.select(
				`
        *,
        "INVENTORY LOG DETAIL" (
          inventory_id,
          inventory:INVENTORY (
            id,
            account_name,
            product_name,
            stocks,
            price_each,
            inserted_by,
            last_updated
          )
        ),
        "RESERVATION DETAIL" (
          id,
          reference_number,
          date_reserved,
          date_pickup,
          status,
          process_by,
          "RESERVED PRODUCT" (
            account_name,
            product_name,
            price_each,
            quantity
          )
        ),
        "SOLD ITEM" (
          account_name,
          product_name,
          price_each,
          quantity
        )
      `
			)
			.order("when", { ascending: false });

		if (error) console.error(error);
		else {
			console.log("Fetched logs:", JSON.stringify(data, null, 2));
			setLogs(data);
		}

		setLoading(false);
	};

	useEffect(() => {
		fetchLogs();

		const subscription = supabase
			.channel("realtime-logs")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "LOG" },
				fetchLogs
			)
			.subscribe();

		return () => supabase.removeChannel(subscription);
	}, []);

	const { downloadSalesReportImage } = useSalesReport(logs);

	const normalize = (str) =>
		str
			?.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]/gi, "");

	const filteredRows = logs.filter((r) => {
		const matchesSearch =
			normalize(r.action).includes(normalize(search)) ||
			normalize(r.process_by).includes(normalize(search));

		const matchesDate = filterDate
			? new Date(r.when).toDateString() ===
			  new Date(filterDate).toDateString()
			: true;

		return matchesSearch && matchesDate;
	});

	const handleRowClick = (row) => {
		setForm(row);
		setShowModal(true);
	};

	// Grouped items for modal
	const groupedItems = {};

	const reservationDetail = form["RESERVATION DETAIL"]?.[0];
	const soldItems = form["SOLD ITEM"];
	const reservedProducts = reservationDetail?.["RESERVED PRODUCT"];

	// Combine items depending on log type
	let items = [];

	// 1️⃣ Use explicit `form.items` if available
	if (form.items?.length > 0) {
		items = form.items;
	}
	// 2️⃣ Sold items first
	else if (soldItems?.length > 0) {
		items = soldItems.map((i) => ({
			account_name: i.account_name,
			product_name: i.product_name,
			price_each: i.price_each,
			qty: i.quantity,
		}));
	}
	// 3️⃣ Cancelled or plain Reserved
	else if (reservedProducts?.length > 0) {
		items = reservedProducts.map((i) => ({
			account_name: i.account_name,
			product_name: i.product_name,
			price_each: i.price_each,
			qty: i.quantity,
		}));
	}

	// Group by account
	items.forEach((i) => {
		if (!groupedItems[i.account_name]) groupedItems[i.account_name] = [];
		groupedItems[i.account_name].push(i);
	});
	const grandTotal = Object.values(groupedItems)
		.flat()
		.reduce((sum, i) => sum + i.price_each * i.qty, 0);

	return (
		<div>
			<h5 className="mb-3">Logs</h5>

			<div className="d-flex justify-content-between mb-2">
				<div className="d-flex gap-2">
					<input
						type="text"
						className="form-control"
						placeholder="Search..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						style={{ maxWidth: "200px" }}
					/>
					<input
						type="date"
						className="form-control"
						value={filterDate}
						onChange={(e) => setFilterDate(e.target.value)}
						style={{ maxWidth: "200px" }}
					/>
				</div>
				<button
					className="btn btn-primary"
					onClick={() => downloadSalesReportImage()}
				>
					Download Sales Report
				</button>
			</div>

			<div className="card shadow-sm">
				<div
					className="card-body p-0"
					style={{ maxHeight: "365px", overflowY: "auto" }}
				>
					<table className="table table-striped table-hover mb-0">
						<thead
							className="table-light"
							style={{ position: "sticky", top: 0, zIndex: 1 }}
						>
							<tr>
								<th>When</th>
								<th>Action</th>
								<th>Process By</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td
										colSpan="3"
										className="text-center text-muted"
									>
										Loading...
									</td>
								</tr>
							) : filteredRows.length === 0 ? (
								<tr>
									<td
										colSpan="3"
										className="text-center text-muted"
									>
										No matching records
									</td>
								</tr>
							) : (
								filteredRows.map((row) => (
									<tr
										key={row.id}
										onClick={() => handleRowClick(row)}
										style={{ cursor: "pointer" }}
									>
										<td>
											{new Date(
												row.when
											).toLocaleString()}
										</td>
										<td>{row.action}</td>
										<td>{row.process_by}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{showModal && (
				<div
					className="modal d-block"
					tabIndex="-1"
					style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
				>
					<div className="modal-dialog modal-md">
						<div className="modal-content rounded-3 shadow-sm p-3">
							<div className="modal-header border-0">
								<h5 className="modal-title">
									{form.action} Details
								</h5>
								<button
									className="btn-close"
									onClick={() => setShowModal(false)}
								></button>
							</div>
							<div className="modal-body">
								<div className="d-flex flex-column gap-3">
									<div className="d-flex justify-content-between">
										<strong>Processed by:</strong>
										<span>{form.process_by}</span>
									</div>
									<div className="d-flex justify-content-between">
										<strong>Log Created:</strong>
										<span>
											{new Date(
												form.when
											).toLocaleString()}
										</span>
									</div>

									{/* Inventory Logs (Group 2) */}
									{form["INVENTORY LOG DETAIL"]?.length >
										0 && (
										<div>
											<strong
												style={{
													marginTop: "10px",
													display: "block",
												}}
											>
												Accounts & Products
											</strong>
											{form["INVENTORY LOG DETAIL"].map(
												(d, idx) => (
													<div
														key={idx}
														className="border p-2 mb-2 rounded"
													>
														<div className="d-flex justify-content-between">
															<strong>
																Action:
															</strong>
															<span>
																{d.log
																	?.action ||
																	"Unknown"}
															</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>ID:</strong>
															<span>
																{d.inventory_id}
															</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>
																Account:
															</strong>
															<span>
																{
																	d.inventory
																		?.account_name
																}
															</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>
																Product:
															</strong>
															<span>
																{
																	d.inventory
																		?.product_name
																}
															</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>
																Stocks:
															</strong>
															<span>
																{
																	d.inventory
																		?.stocks
																}
															</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>
																Price:
															</strong>
															<span>
																₱
																{
																	d.inventory
																		?.price_each
																}
															</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>
																Inserted By:
															</strong>
															<span>
																{
																	d.inventory
																		?.inserted_by
																}
															</span>
														</div>
													</div>
												)
											)}
										</div>
									)}

									{/* Transaction Items */}
									{Object.keys(groupedItems).length > 0 && (
										<div>
											<h6
												style={{
													borderBottom:
														"2px solid #ccc",
													paddingBottom: "5px",
													marginBottom: "10px",
													marginTop: "10px",
												}}
											>
												Transactions
											</h6>

											{form.reference_number && (
												<div className="d-flex justify-content-between">
													<strong>
														Reference #:
													</strong>
													<span>
														{form.reference_number}
													</span>
												</div>
											)}

											{form[
												"RESERVATION DETAIL"
											]?.[0] && (
												<>
													{(() => {
														const reservation =
															form[
																"RESERVATION DETAIL"
															][0];
														return (
															<>
																<div className="d-flex justify-content-between mt-2">
																	<strong>
																		Status:
																	</strong>
																	<span>
																		{reservation.status ||
																			"Reserved"}
																	</span>
																</div>

																{/* Show dates only if it was reserved at some point */}
																{reservation.status.includes(
																	"Reserved"
																) && (
																	<>
																		<div className="d-flex justify-content-between mt-2">
																			<strong>
																				Date
																				Reserved:
																			</strong>
																			<span>
																				{
																					reservation.date_reserved
																				}
																			</span>
																		</div>
																		<div className="d-flex justify-content-between mt-2">
																			<strong>
																				Date
																				Pickup:
																			</strong>
																			<span>
																				{
																					reservation.date_pickup
																				}
																			</span>
																		</div>
																	</>
																)}

																{/* Sold info */}
																{reservation.status.includes(
																	"Sold"
																) && (
																	<div className="d-flex justify-content-between mt-2">
																		<strong>
																			Action:
																		</strong>
																		<span>
																			Sold
																		</span>
																	</div>
																)}

																{/* Cancelled info */}
																{reservation.status.includes(
																	"Cancelled"
																) && (
																	<div className="d-flex justify-content-between mt-2">
																		<strong>
																			Action:
																		</strong>
																		<span>
																			Cancelled
																		</span>
																	</div>
																)}
															</>
														);
													})()}
												</>
											)}

											{/* Products */}
											<strong
												style={{
													marginTop: "10px",
													display: "block",
												}}
											>
												Accounts & Products
											</strong>
											<div
												style={{
													maxHeight: "150px",
													overflowY: "auto",
													border: "1px solid #ddd",
													padding: "5px",
													marginTop: "5px",
												}}
											>
												{Object.entries(
													groupedItems
												).map(([acc, products]) => (
													<div
														key={acc}
														className="mb-2"
													>
														<strong>{acc}</strong>
														<ul className="mb-0">
															{products.map(
																(p, idx) => (
																	<li
																		key={
																			idx
																		}
																	>
																		{
																			p.product_name
																		}{" "}
																		| ₱
																		{
																			p.price_each
																		}{" "}
																		| qty:{" "}
																		{p.qty}
																	</li>
																)
															)}
														</ul>
													</div>
												))}
											</div>

											<div className="d-flex justify-content-between mt-2">
												<strong>Grand Total:</strong>
												<span>₱{grandTotal}</span>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
