import { useState } from "react";
import useSalesReport from "./hooks/useSalesReport";
export default function LogsPage() {
	const [showModal, setShowModal] = useState(false);
	const [form, setForm] = useState({});
	const [search, setSearch] = useState("");
	const [filterDate, setFilterDate] = useState("");

	const dummyData = [
		{
			id: 1,
			when: "8/28/2025, 12:00 PM",
			action: "Inventory",
			process_by: "Ekong",
			details: [
				{
					id: "INV001",
					account_name: "xachi",
					product_name: "T-Rex",
					stocks: 50,
					price_each: 95,
					inserted_by: "Ekong",
					date_inserted: "8/28/2025, 10:00 AM",
				},
			],
		},
		{
			id: 2,
			when: "8/29/2025, 1:00 PM",
			action: "Reserve",
			reference: "TRX002",
			process_by: "Ann",
			items: [
				{
					account_name: "xachi",
					product_name: "T-Rex",
					price_each: 95,
					qty: 2,
				},
				{
					account_name: "xachi2",
					product_name: "Butterfly",
					price_each: 95,
					qty: 1,
				},
			],
		},
		{
			id: 3,
			when: "8/29/2025, 2:00 PM",
			action: "Sell",
			reference: "TRX003",
			process_by: "John",
			items: [
				{
					account_name: "xachi3",
					product_name: "Dragonfly",
					price_each: 95,
					qty: 3,
				},
			],
		},
		{
			id: 4,
			when: "8/29/2025, 3:30 PM",
			action: "Sell",
			reference: "TRX004",
			process_by: "Ann",
			items: [
				{
					account_name: "xachi",
					product_name: "T-Rex",
					price_each: 95,
					qty: 1,
				},
				{
					account_name: "xachi2",
					product_name: "Dragonfly",
					price_each: 95,
					qty: 2,
				},
			],
		},
		{
			id: 5,
			when: "8/29/2025, 4:00 PM",
			action: "Sell",
			reference: "TRX005",
			process_by: "John",
			items: [
				{
					account_name: "xachi3",
					product_name: "Butterfly",
					price_each: 95,
					qty: 4,
				},
			],
		},
		{
			id: 6,
			when: "8/29/2025, 5:15 PM",
			action: "Sell",
			reference: "TRX006",
			process_by: "Ekong",
			items: [
				{
					account_name: "xachi",
					product_name: "Dragonfly",
					price_each: 95,
					qty: 2,
				},
				{
					account_name: "xachi2",
					product_name: "T-Rex",
					price_each: 95,
					qty: 1,
				},
			],
		},
		{
			id: 7,
			when: "8/29/2025, 6:00 PM",
			action: "Sell",
			reference: "TRX007",
			process_by: "Ann",
			items: [
				{
					account_name: "xachi3",
					product_name: "T-Rex",
					price_each: 95,
					qty: 5,
				},
			],
		},
	];

	const { downloadSalesReportImage } = useSalesReport(dummyData);

	const normalize = (str) =>
		str
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]/gi, "");

	// filter by search and date
	const filteredRows = dummyData.filter((r) => {
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

	const groupedItems = {};
	if (form.items) {
		form.items.forEach((i) => {
			if (!groupedItems[i.account_name])
				groupedItems[i.account_name] = [];
			groupedItems[i.account_name].push(i);
		});
	}

	const grandTotal = form.items
		? form.items.reduce((sum, i) => sum + i.price_each * i.qty, 0)
		: 0;

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
					onClick={downloadSalesReportImage}
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
							{filteredRows.map((row) => (
								<tr
									key={row.id}
									onClick={() => handleRowClick(row)}
									style={{ cursor: "pointer" }}
								>
									<td>{row.when}</td>
									<td>{row.action}</td>
									<td>{row.process_by}</td>
								</tr>
							))}
							{filteredRows.length === 0 && (
								<tr>
									<td
										colSpan="3"
										className="text-center text-muted"
									>
										No matching records
									</td>
								</tr>
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
										<strong>When:</strong>
										<span>{form.when}</span>
									</div>

									{/* Inventory */}
									{form.action === "Inventory" &&
										form.details && (
											<div style={{ marginTop: "10px" }}>
												{form.details.map((d, idx) => (
													<div
														key={idx}
														className="border p-2 mb-2 rounded"
													>
														<div className="d-flex justify-content-between">
															<strong>ID:</strong>
															<span>{d.id}</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>
																Account:
															</strong>
															<span>
																{d.account_name}
															</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>
																Product:
															</strong>
															<span>
																{d.product_name}
															</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>
																Stocks:
															</strong>
															<span>
																{d.stocks}
															</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>
																Price:
															</strong>
															<span>
																₱{d.price_each}
															</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>
																Inserted By:
															</strong>
															<span>
																{d.inserted_by}
															</span>
														</div>
														<div className="d-flex justify-content-between">
															<strong>
																Date Inserted:
															</strong>
															<span>
																{
																	d.date_inserted
																}
															</span>
														</div>
													</div>
												))}
											</div>
										)}

									{/* Reserve or Sell */}
									{(form.action === "Reserve" ||
										form.action === "Sell") &&
										form.items && (
											<div>
												<div className="d-flex justify-content-between">
													<strong>
														Reference #:
													</strong>
													<span>
														{form.reference || "-"}
													</span>
												</div>

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
															<strong>
																{acc}
															</strong>
															<ul className="mb-0">
																{products.map(
																	(
																		p,
																		idx
																	) => (
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
																			|
																			qty:{" "}
																			{
																				p.qty
																			}
																		</li>
																	)
																)}
															</ul>
														</div>
													))}
												</div>
												<div className="d-flex justify-content-between mt-2">
													<strong>
														Grand Total:
													</strong>
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
