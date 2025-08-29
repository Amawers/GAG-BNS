// components/TransactionConfirmationModal.jsx
import React, { useState } from "react";

export default function TransactionConfirmationModal({
	cart,
	grandTotal,
	onClose,
	onConfirm,
	confirmText = "Confirm",
	confirmColor = "success",
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
							<button className={`btn btn-${confirmColor}`} onClick={onConfirm}>
								{confirmText}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
