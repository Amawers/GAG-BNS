import { useEffect, useState } from "react";
import AddInventoryModal from "./components/AddInventoryModal";
import Swal from "sweetalert2";
import { supabase } from "./supabaseClient";
export default function InventoryPage() {
	const [showModal, setShowModal] = useState(false);
	const [mode, setMode] = useState("new"); // "new" | "details"
	const [form, setForm] = useState({});
	const [editMode, setEditMode] = useState(false);
	const [search, setSearch] = useState("");
	const [accountFilter, setAccountFilter] = useState("");

	const [inventory, setInventory] = useState([]);

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

	const fetchInventory = async () => {
		const { data, error } = await supabase
			.from("INVENTORY")
			.select("*")
			.order("last_updated", { ascending: false });
		if (!error) setInventory(data);
		else console.error("Fetch inventory error:", error);
	};

	useEffect(() => {
		fetchInventory();

		const channel = supabase
			.channel("inventory-changes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "INVENTORY" },
				(payload) => {
					console.log("Realtime payload:", payload);

					// Auto-refresh inventory when data changes
					if (
						["INSERT", "UPDATE", "DELETE"].includes(
							payload.eventType
						)
					) {
						fetchInventory();
					}
				}
			)
			.subscribe((status) => console.log("Channel status:", status));

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	const normalize = (str) =>
		str
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]/gi, "");

	const filteredRows = inventory.filter((r) => {
		const matchesSearch =
			normalize(r.account_name).includes(normalize(search)) ||
			normalize(r.product_name).includes(normalize(search)) ||
			normalize(r.inserted_by).includes(normalize(search));
		const matchesAccount = accountFilter
			? r.account_name === accountFilter
			: true;
		return matchesSearch && matchesAccount;
	});

	const handleOpenAdd = () => {
		Swal.fire({
			title: "Do you want to add a new inventory?",
			text: "Check if the item already exists; if it does, just search and edit it.",
			showDenyButton: true,
			confirmButtonText: "Yes",
			denyButtonText: "No",
			confirmButtonColor: "#28a745", // green
		}).then((result) => {
			if (result.isConfirmed) {
				setForm({});
				setMode("new");
				setShowModal(true);
				setEditMode(false);
			}
		});
	};

	const handleRowClick = (row) => {
		setForm(row);
		setMode("details");
		setShowModal(true);
		setEditMode(false);
	};

	const handleChange = (key, value) => {
		setForm({ ...form, [key]: value });
	};

	const accounts = [...new Set(inventory.map((d) => d.account_name))];

	// 1️⃣ Define handleDelete somewhere at the top of InventoryPage
	const handleDelete = async (id) => {
		const result = await Swal.fire({
			title: "Are you sure you want to delete this record?",
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Yes, delete it",
			cancelButtonText: "No",
			confirmButtonColor: "#dc3545",
		});

		if (!result.isConfirmed) return;

		try {
			await supabase
				.from("INVENTORY LOG DETAIL")
				.delete()
				.eq("inventory_id", id);
			await supabase.from("INVENTORY").delete().eq("id", id);
			setShowModal(false);

			Swal.fire({
				toast: true,
				position: "top-end",
				icon: "success",
				title: "Record deleted!",
				showConfirmButton: false,
				timer: 2000,
				timerProgressBar: true,
			});

			fetchInventory(); // refresh table
		} catch (err) {
			Swal.fire({
				icon: "error",
				title: "Delete failed",
				text: err.message,
			});
		}
	};

	const handleEdit = async () => {
		const result = await Swal.fire({
			title: "Save changes?",
			text: "Are you sure you want to save the changes?",
			icon: "question",
			showCancelButton: true,
			confirmButtonText: "Save",
			cancelButtonText: "Cancel",
			confirmButtonColor: "#28a745",
		});

		if (!result.isConfirmed) return;

		try {
			const { error } = await supabase
				.from("INVENTORY")
				.update({
					account_name: form.account_name,
					product_name: form.product_name,
					stocks: form.stocks,
					reserved: form.reserved,
					price_each: form.price_each,
					inserted_by: form.inserted_by,
					last_updated: new Date().toISOString(),
				})
				.eq("id", form.id);

			if (error) throw error;

			setEditMode(false);
			setShowModal(false);
			fetchInventory();

			Swal.fire({
				toast: true,
				position: "top-end",
				icon: "success",
				title: "Changes saved!",
				showConfirmButton: false,
				timer: 2000,
				timerProgressBar: true,
			});
		} catch (err) {
			Swal.fire({
				icon: "error",
				title: "Update failed",
				text: err.message,
			});
		}
	};

	return (
		<div>
			<h5 className="mb-3 d-flex justify-content-between align-items-center">
				Inventory
			</h5>

			<div className="d-flex gap-2 mb-2">
				<input
					type="text"
					className="form-control"
					placeholder="Search..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{ maxWidth: "200px" }}
				/>
				<select
					className="form-select"
					value={accountFilter}
					onChange={(e) => setAccountFilter(e.target.value)}
					style={{ maxWidth: "150px" }}
				>
					<option value="">All Accounts</option>
					{accounts.map((acc) => (
						<option key={acc} value={acc}>
							{acc}
						</option>
					))}
				</select>
				<button
					className="btn btn-primary btn-sm ms-auto fw-medium"
					onClick={handleOpenAdd}
				>
					Add Inventory
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
								<th>Account</th>
								<th>Product</th>
								<th>Stocks</th>
								<th>Reserved</th>
								<th>Available</th>
								<th>Price</th>
							</tr>
						</thead>
						<tbody>
							{filteredRows.map((row) => (
								<tr
									key={row.id}
									onClick={() => handleRowClick(row)}
									style={{ cursor: "pointer" }}
								>
									<td>{row.account_name}</td>
									<td>{row.product_name}</td>
									<td>{row.stocks}</td>
									<td>{row.reserved}</td>
									<td>{row.stocks - row.reserved}</td>
									<td>₱{row.price_each}</td>
								</tr>
							))}
							{filteredRows.length === 0 && (
								<tr>
									<td
										colSpan="6"
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

			{mode === "new" && (
				<AddInventoryModal
					show={showModal}
					form={form}
					setForm={setForm}
					onClose={() => setShowModal(false)}
				/>
			)}

			{mode === "details" && showModal && (
				<div
					className="modal d-block"
					tabIndex="-1"
					style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
				>
					<div className="modal-dialog modal-md">
						<div className="modal-content rounded-3 shadow-sm p-3">
							<div className="modal-header border-0 ">
								<h5 className="modal-title">
									Inventory Details
								</h5>
								<button
									className="btn-close"
									onClick={() => setShowModal(false)}
								></button>
							</div>
							<div className="modal-body">
								<div className="d-flex flex-column">
									{Object.entries(form).map(
										([key, value], idx) => {
											if (key === "id") return null; // skip rendering id

											const isReadOnly = [
												"last_updated",
												"available",
											].includes(key); // available is read-only
											let displayValue = value;

											if (key === "last_updated") {
												displayValue =
													formatDateTime(value);
											}
											return (
												<div
													key={key}
													className="d-flex justify-content-between align-items-center py-2"
													style={{
														borderBottom:
															idx !==
															Object.entries(form)
																.length -
																1
																? "1px solid #eee"
																: "none",
													}}
												>
													<strong
														style={{
															textTransform:
																"capitalize",
															color: "#555",
														}}
													>
														{key.replace("_", " ")}
													</strong>

													{editMode && !isReadOnly ? (
														key ===
														"inserted_by" ? (
															<select
																className="form-select form-select-sm"
																style={{
																	maxWidth:
																		"150px",
																}}
																value={value}
																onChange={(e) =>
																	handleChange(
																		key,
																		e.target
																			.value
																	)
																}
															>
																{[
																	"Ekong",
																	"Xachi",
																].map(
																	(name) => (
																		<option
																			key={
																				name
																			}
																			value={
																				name
																			}
																		>
																			{
																				name
																			}
																		</option>
																	)
																)}
															</select>
														) : [
																"stocks",
																"reserved",
																"price_each",
																"sold",
														  ].includes(key) ? (
															<input
																type="number"
																value={value}
																className="form-control form-control-sm"
																style={{
																	maxWidth:
																		"150px",
																}}
																onChange={(e) =>
																	handleChange(
																		key,
																		e.target
																			.value
																	)
																}
															/>
														) : (
															<input
																type="text"
																value={value}
																className="form-control form-control-sm"
																style={{
																	maxWidth:
																		"150px",
																}}
																onChange={(e) =>
																	handleChange(
																		key,
																		e.target
																			.value
																	)
																}
															/>
														)
													) : key === "price_each" ? (
														<span
															style={{
																color: "#333",
															}}
														>
															₱{value}
														</span>
													) : key === "available" ? (
														<span
															style={{
																color: "#333",
															}}
														>
															{value}
														</span>
													) : (
														<span style={{ color: "#333" }}>
  {key === "account_name" 
    ? `${value} ${form.user_name ? `(@${form.user_name})` : ""}` 
    : displayValue}
</span>

													)}
												</div>
											);
										}
									)}
								</div>
							</div>

							<div className="modal-footer border-0 justify-content-between">
								<div className="d-flex gap-2">
									<button
										className={`btn btn-sm ${
											editMode
												? "btn-success"
												: "btn-warning"
										}`}
										onClick={() => {
											if (editMode) handleEdit();
											else setEditMode(true);
										}}
									>
										{editMode ? "Save Edit" : "Edit"}
									</button>

									<button
										className="btn btn-sm btn-danger"
										onClick={() => handleDelete(form.id)}
									>
										Delete
									</button>
								</div>
								{editMode && (
									<button
										className="btn btn-sm btn-secondary"
										onClick={() => setEditMode(false)}
									>
										Cancel
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
