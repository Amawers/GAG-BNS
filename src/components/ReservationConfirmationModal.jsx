import React, { useState } from "react";
import Swal from "sweetalert2";

export default function ReservationConfirmationModal({
  cart,
  grandTotal,
  onClose,
  onReserve,
}) {
  const [customerName, setCustomerName] = useState("");
  const [reservedBy, setReservedBy] = useState("Ekong"); // default
  const [pickupDateTime, setPickupDateTime] = useState("");

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Reservation</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <p>Do you want to reserve the items in your cart?</p>

            <div className="mb-2 d-flex gap-2">
              <input
                type="text"
                className="form-control"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />

              <select
                className="form-select"
                value={reservedBy}
                onChange={(e) => setReservedBy(e.target.value)}
              >
                <option value="Ekong">Ekong</option>
                <option value="Xachi">Xachi</option>
              </select>
            </div>

            <div className="mb-2">
              <label className="form-label">Pickup Date & Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={pickupDateTime}
                onChange={(e) => setPickupDateTime(e.target.value)}
              />
            </div>

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
                    {item.product_name} x {item.qty} (₱{item.price_each} each)
                  </span>
                  <span>₱{item.qty * item.price_each}</span>
                </li>
              ))}
            </ul>

            <h5 className="text-end mt-2">Grand Total: ₱{grandTotal}</h5>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              className="btn btn-warning"
              onClick={() => {
                onReserve({ customerName, reservedBy, pickupDateTime });
                Swal.fire({
                  toast: true,
                  position: "top-end",
                  icon: "success",
                  title: "Items reserved!",
                  showConfirmButton: false,
                  timer: 2000,
                  timerProgressBar: true,
                });
              }}
            >
              Reserve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
