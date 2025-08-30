// components/TransactionConfirmationModal.jsx
import React, { useState } from "react";
import Swal from "sweetalert2";
import supabase from "../../config/supabase"

export default function TransactionConfirmationModal({
	cart,
	grandTotal,
	onClose
}) {
	const [processor, setProcessor] = useState("Ekong"); // default value

	const copyReceipt = () => {
		let text = "💰 GCASH (SEND SS)\n\n";
		text += "📱 09176618217 CJD\n\n";
		text += "----------------------\n";
		text += "💻 TRANSACTION \n";
		text += "----------------------\n";

		// Products
		cart.forEach((item) => {
			let name = item.product_name;
			const words = name.split(" ");
			if (words.length === 2) {
				name = words.map((w) => w[0]).join(""); // abbreviate two words
			}
			text += `🛒 ${name} x ${item.qty} = ₱${
				item.price_each * item.qty
			} (${item.account_name} ${item.user_name})\n`;
		});

		text += "--------------------------\n";
		text += `⚖️ Grand Total: ₱${grandTotal}\n\n`;
		text +=
			"➕ ADD THE FOLLOWING ACCOUNTS AND THEN CREATE YOUR PRIVATE SERVER, I WILL JOIN:\n\n";

		// Only account names with username (unique)
		const accountMap = {};
		cart.forEach((item) => {
			accountMap[item.account_name] = item.user_name; // last one wins
		});
		Object.entries(accountMap).forEach(([name, user]) => {
			text += `👤 ${name} (${user})\n`;
		});

		// Processor
		text += "\n------------------------\n";
		text += `Processed by: ${processor}\n`;

		navigator.clipboard
			.writeText(text)
			.then(() => alert("Receipt copied to clipboard!"))
			.catch(() => alert("Failed to copy"));
	};

	const handleConfirm = async () => {
    try {
      const items = cart.map((item) => ({
        account_name: item.account_name,
        product_name: item.product_name,
        price_each: item.price_each,
        quantity: item.qty,
      }));

      const { data, error } = await supabase.rpc("create_sale_transaction", {
        p_process_by: processor,
        p_items: items,
      });

      if (error) throw error;

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Sale confirmed!",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      console.log("RPC result:", data);

      onClose(); // close modal
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Sale failed",
        text: err.message,
      });
    }
  };

	return (
		<div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
			<div className="modal-dialog">
				<div className="modal-content p-3">
					<div className="modal-header">
						<h5 className="modal-title">Transaction</h5>
						<button type="button" className="btn-close" onClick={onClose}></button>
					</div>

					<div className="modal-body">
						<p>Confirm with client before clicking "Confirm Sale"</p>
						
						{/* Processor dropdown */}
						<div className="mb-3">
							<label className="form-label">Processed by:</label>
							<select
								className="form-select"
								value={processor}
								onChange={(e) => setProcessor(e.target.value)}
							>
								<option value="Ekong">Ekong</option>
								<option value="Ann">Ann</option>
							</select>
						</div>

						<ul
							className="list-group mb-2"
							style={{
								maxHeight: "200px",
								overflowY: cart.length > 5 ? "auto" : "visible",
							}}
						>
							{cart.map((item) => (
								<li
									key={item.id}
									className="list-group-item d-flex justify-content-between align-items-center"
								>
									<span>
										{item.product_name} x {item.qty}
									</span>
									<span>₱{item.qty * item.price_each}</span>
								</li>
							))}
						</ul>
						<h5 className="text-end">Grand Total: ₱{grandTotal}</h5>
					</div>

					<div className="modal-footer d-flex justify-content-between">
						<button className="btn btn-outline-secondary" onClick={copyReceipt}>
							📋 Copy Receipt
						</button>
						<div>
							<button className="btn btn-secondary me-2" onClick={onClose}>
								Close
							</button>
							<button className={`btn btn-success`} onClick={handleConfirm}>
								Confirm Sale
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
