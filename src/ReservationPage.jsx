import { useState } from "react";
import Swal from "sweetalert2";

export default function ReservationPage() {
	const [showModal, setShowModal] = useState(false);
	const [form, setForm] = useState({});
	const [search, setSearch] = useState("");

	const dummyData = [
		{
			id: 1,
			reference: "TRX001",
			date_reserved: "8/29/2025, 12:00 PM",
			date_pickup: "9/1/2025, 3:00 PM",
			status: "Pending",
			process_by: "Ekong",
			items: [
				{
					account_name: "xachi",
					product_name: "T-Rex",
					price_each: 95,
					qty: 1,
				},
				{
					account_name: "xachi",
					product_name: "Butterfly",
					price_each: 95,
					qty: 2,
				},
				{
					account_name: "xachi",
					product_name: "Dragonfly",
					price_each: 95,
					qty: 1,
				},
				{
					account_name: "xachi2",
					product_name: "Mimic",
					price_each: 95,
					qty: 1,
				},
				{
					account_name: "xachi2",
					product_name: "Butterfly",
					price_each: 95,
					qty: 2,
				},
				{
					account_name: "xachi2",
					product_name: "Dragonfly",
					price_each: 95,
					qty: 1,
				},
				{
					account_name: "xachi3",
					product_name: "T-Rex",
					price_each: 95,
					qty: 1,
				},
				{
					account_name: "xachi3",
					product_name: "Dragonfly",
					price_each: 95,
					qty: 2,
				},
				{
					account_name: "xachi3",
					product_name: "Butterfly",
					price_each: 95,
					qty: 1,
				},
			],
		},
		{
			id: 2,
			reference: "TRX002",
			date_reserved: "8/28/2025, 10:30 AM",
			date_pickup: "8/30/2025, 2:00 PM",
			status: "Confirmed",
			process_by: "Ann",
			items: [
				{
					account_name: "xachi3",
					product_name: "Dragonfly",
					price_each: 95,
					qty: 3,
				},
				{
					account_name: "xachi2",
					product_name: "Butterfly",
					price_each: 95,
					qty: 1,
				},
				{
					account_name: "xachi",
					product_name: "T-Rex",
					price_each: 95,
					qty: 2,
				},
			],
		},
	];

	const normalize = (str) =>
		str
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]/gi, "");

	const filteredRows = dummyData.filter(
		(r) =>
			normalize(r.reference).includes(normalize(search)) ||
			normalize(r.status).includes(normalize(search))
	);

	const handleRowClick = (row) => {
		setForm(row);
		setShowModal(true);
	};

	const grandTotal = form.items
		? form.items.reduce((sum, i) => sum + i.price_each * i.qty, 0)
		: 0;

	const groupedItems = {};
	if (form.items) {
		form.items.forEach((i) => {
			if (!groupedItems[i.account_name])
				groupedItems[i.account_name] = [];
			groupedItems[i.account_name].push(i);
		});
	}

	return (
		<div>
			<h5 className="mb-3">Reservations</h5>

			<div className="d-flex gap-2 mb-2">
				<input
					type="text"
					className="form-control"
					placeholder="Search..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{ maxWidth: "200px" }}
				/>
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
								<th>Reference #</th>
								<th>Date Reserved</th>
								<th>Date Pickup</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{filteredRows.map((row) => (
								<tr
									key={row.id}
									onClick={() => handleRowClick(row)}
									style={{ cursor: "pointer" }}
								>
									<td>{row.reference}</td>
									<td>{row.date_reserved}</td>
									<td>{row.date_pickup}</td>
									<td>{row.status}</td>
								</tr>
							))}
							{filteredRows.length === 0 && (
								<tr>
									<td
										colSpan="4"
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
									Reservation Details
								</h5>
								<button
									className="btn-close"
									onClick={() => setShowModal(false)}
								></button>
							</div>
							<div className="modal-body">
								<div className="d-flex flex-column gap-3">
									<div className="d-flex justify-content-between">
										<strong>Reference #:</strong>
										<span>{form.reference}</span>
									</div>
									<div className="d-flex justify-content-between">
										<strong>Date Reserved:</strong>
										<span>{form.date_reserved}</span>
									</div>
									<div className="d-flex justify-content-between">
										<strong>Date Pickup:</strong>
										<span>{form.date_pickup}</span>
									</div>
									<div className="d-flex justify-content-between align-items-center mt-2">
										<strong>Processed by:</strong>
										<span>
											{form.process_by || "Ekong"}
										</span>
									</div>

									<div className="d-flex justify-content-between">
										<strong>Status:</strong>
										<span>{form.status}</span>
									</div>

									<div>
										<strong>Accounts & Products</strong>
										<div
											style={{
												maxHeight: "150px",
												overflowY: "auto",
												border: "1px solid #ddd",
												padding: "5px",
												marginTop: "5px",
											}}
										>
											{Object.entries(groupedItems).map(
												([acc, products]) => (
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
												)
											)}
										</div>
									</div>
								</div>
							</div>

							<div className="modal-footer border-0 justify-content-between align-items-center">
								<strong>Grand Total: ₱{grandTotal}</strong>
								<div className="d-flex gap-2">
									<button
										className="btn btn-sm btn-danger"
										onClick={() => {
											Swal.fire({
												title: "Cancel this reservation?",
												icon: "warning",
												showCancelButton: true,
												confirmButtonText:
													"Yes, cancel",
												cancelButtonText: "No",
												confirmButtonColor: "#dc3545",
											}).then((result) => {
												if (result.isConfirmed) {
													console.log(
														"Cancelled reservation:",
														form.id
													);
													setShowModal(false);
													Swal.fire({
														toast: true,
														position: "top-end",
														icon: "success",
														title: "Reservation cancelled!",
														showConfirmButton: false,
														timer: 2000,
														timerProgressBar: true,
													});
												}
											});
										}}
									>
										Cancel Reservation
									</button>

									<button
										className="btn btn-sm btn-success"
										onClick={() => {
											Swal.fire({
												title: "Confirm this reservation?",
												icon: "question",
												showCancelButton: true,
												confirmButtonText:
													"Yes, confirm",
												cancelButtonText: "No",
												confirmButtonColor: "#28a745",
											}).then((result) => {
												if (result.isConfirmed) {
													console.log(
														"Confirmed reservation:",
														form.id
													);
													setShowModal(false);
													Swal.fire({
														toast: true,
														position: "top-end",
														icon: "success",
														title: "Reservation confirmed!",
														showConfirmButton: false,
														timer: 2000,
														timerProgressBar: true,
													});
												}
											});
										}}
									>
										Confirm
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
