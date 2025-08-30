import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import supabase from "../config/supabase";

export default function ReservationPage() {
	const [showModal, setShowModal] = useState(false);
	const [form, setForm] = useState({});
	const [search, setSearch] = useState("");
	const [reservations, setReservations] = useState([]);

	function formatDateTime(isoString) {
		const date = new Date(isoString);
		const options = {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		};
		return date.toLocaleString("en-US", options);
	}

	const fetchReservations = async () => {
		const { data, error } = await supabase
			.from("RESERVATION DETAIL")
			.select(
				`
      id,
      log_id,
      reference_number,
      date_reserved,
      date_pickup,
      status,
      process_by,
	  customer_name,
      "RESERVED PRODUCT" (
        account_name,
        product_name,
        price_each,
        quantity
      )
    `
			)
			.order("date_reserved", { ascending: false });

		if (!error) {
			console.log("Reservations JSON:", JSON.stringify(data, null, 2));
			setReservations(data);
		} else console.error(error);
	};

	useEffect(() => {
		fetchReservations();

		const channel = supabase
			.channel("reservation-changes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "RESERVATION DETAIL" },
				(payload) => {
					console.log("Realtime update:", payload);
					fetchReservations();
				}
			)
			.subscribe((status) => console.log("Channel status:", status));

		return () => supabase.removeChannel(channel);
	}, []);

	const normalize = (str) =>
		(str || "")
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]/gi, "");

	const filteredRows = reservations.filter(
		(r) =>
			normalize(r.reference_number).includes(normalize(search)) ||
			normalize(r.status).includes(normalize(search))
	);

	const handleRowClick = (row) => {
		setForm(row);
		setShowModal(true);
	};

	const grandTotal = form["RESERVED PRODUCT"]
		? form["RESERVED PRODUCT"].reduce(
				(sum, i) => sum + i.price_each * i.quantity,
				0
		  )
		: 0;

	const groupedItems = {};
	if (form["RESERVED PRODUCT"]) {
		form["RESERVED PRODUCT"].forEach((i) => {
			if (!groupedItems[i.account_name])
				groupedItems[i.account_name] = [];
			groupedItems[i.account_name].push(i);
		});
	}

	const confirmReservation = async (reservationId) => {
		try {
			const { error } = await supabase
				.from("RESERVATION DETAIL")
				.update({ status: "Confirmed" })
				.eq("id", reservationId);

			if (error) throw error;

			Swal.fire({
				toast: true,
				position: "top-end",
				icon: "success",
				title: "Reservation confirmed!",
				showConfirmButton: false,
				timer: 2000,
				timerProgressBar: true,
			});
		} catch (err) {
			Swal.fire({
				icon: "error",
				title: "Error confirming reservation",
				text: err.message,
			});
		}
	};

	const getStatusBadge = (status) => {
		switch (status) {
			case "Confirmed":
				return "badge bg-success"; // green
			case "Pending":
				return "badge bg-secondary"; // grey
			case "Cancelled":
				return "badge bg-danger"; // red
			default:
				return "badge bg-light text-dark";
		}
	};

	const cancelReservation = async (reservationId) => {
		try {
			const { error } = await supabase
				.from("RESERVATION DETAIL")
				.update({ status: "Cancelled" })
				.eq("id", reservationId);

			if (error) throw error;

			Swal.fire({
				toast: true,
				position: "top-end",
				icon: "success",
				title: "Reservation cancelled!",
				showConfirmButton: false,
				timer: 2000,
				timerProgressBar: true,
			});

			fetchReservations();
			setShowModal(false);
		} catch (err) {
			Swal.fire({
				icon: "error",
				title: "Error cancelling reservation",
				text: err.message,
			});
		}
	};

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
					style={{ maxHeight: "510px", overflowY: "auto" }}
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
									<td>{row.reference_number}</td>
									<td>{formatDateTime(row.date_reserved)}</td>
									<td>{formatDateTime(row.date_pickup)}</td>
									<td>
										<span
											className={getStatusBadge(
												row.status
											)}
										>
											{row.status}
										</span>
									</td>{" "}
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
										<span>{form.reference_number}</span>
									</div>
									<div className="d-flex justify-content-between">
										<strong>Customer Name:</strong>
										<span>{form.customer_name || "-"}</span>
									</div>
									<div className="d-flex justify-content-between">
										<strong>Date Reserved:</strong>
										<span>
											{formatDateTime(form.date_reserved)}
										</span>
									</div>
									<div className="d-flex justify-content-between">
										<strong>Date Pickup:</strong>
										<span>
											{formatDateTime(form.date_pickup)}
										</span>
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
																		{
																			p.quantity
																		}
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
									{form.status === "Pending" && (
										<>
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
														confirmButtonColor:
															"#dc3545",
													}).then((result) => {
														if (
															result.isConfirmed
														) {
															cancelReservation(
																form.id
															);
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
														confirmButtonColor:
															"#28a745",
													}).then((result) => {
														if (
															result.isConfirmed
														) {
															confirmReservation(
																form.id
															);
															setShowModal(false);
														}
													});
												}}
											>
												Confirm
											</button>
										</>
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
