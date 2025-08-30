import React, { useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "../supabaseClient"; // make sure you import your Supabase client

export default function ReservationConfirmationModal({
	cart,
	grandTotal,
	onClose,
}) {
	const [customerName, setCustomerName] = useState("");
	const [reservedBy, setReservedBy] = useState("Ekong"); // default
	const [pickupDateTime, setPickupDateTime] = useState("");

	const handleReserve = async () => {
		try {
			const items = cart.map((item) => ({
				account_name: item.account_name,
				product_name: item.product_name,
				price_each: item.price_each,
				quantity: item.qty,
			}));

			const { data, error } = await supabase.rpc(
				"create_reservation_transaction",
				{
					p_process_by: reservedBy,
					p_items: items,
					p_pickup_date: pickupDateTime, // <-- add this
					    p_customer_name: customerName, // <-- added

				}
			);

			if (error) throw error;

			Swal.fire({
				toast: true,
				position: "top-end",
				icon: "success",
				title: "Items reserved successfully!",
				showConfirmButton: false,
				timer: 2000,
				timerProgressBar: true,
			});

			console.log("RPC result:", data);
			onClose();
		} catch (err) {
			Swal.fire({
				icon: "error",
				title: "Reservation failed",
				text: err.message,
			});
		}
	};

	return (
		<div
			className="modal show d-block"
			style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
		>
			<div className="modal-dialog">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title">Reservation</h5>
						<button
							type="button"
							className="btn-close"
							onClick={onClose}
						></button>
					</div>
					<div className="modal-body">
						<p>Do you want to reserve the items in your cart?</p>

						<input
							type="text"
							className="form-control mb-2"
							placeholder="Customer name"
							value={customerName}
							onChange={(e) => setCustomerName(e.target.value)}
						/>
						<select
							className="form-select mb-2"
							value={reservedBy}
							onChange={(e) => setReservedBy(e.target.value)}
						>
							<option value="Ekong">Ekong</option>
							<option value="Xachi">Xachi</option>
						</select>
						<input
							type="datetime-local"
							className="form-control mb-2"
							value={pickupDateTime}
							onChange={(e) => setPickupDateTime(e.target.value)}
						/>
						<ul
							className="list-group mb-2"
							style={{
								maxHeight: "150px",
								overflowY: cart.length > 3 ? "auto" : "visible",
							}}
						>
							{cart.map((item) => (
								<li
									key={item.id}
									className="list-group-item d-flex justify-content-between"
								>
									<span>
										{item.product_name} x {item.qty} (₱
										{item.price_each})
									</span>
									<span>₱{item.qty * item.price_each}</span>
								</li>
							))}
						</ul>
						<h5 className="text-end">Grand Total: ₱{grandTotal}</h5>
					</div>
					<div className="modal-footer">
						<button className="btn btn-secondary" onClick={onClose}>
							Close
						</button>
						<button
							className="btn btn-warning"
							onClick={handleReserve}
						>
							Reserve
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
