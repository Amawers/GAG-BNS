// ✅ Reusable Modal Component (Form Only)
import Swal from "sweetalert2";

export default function AddInventoryModal({ show, form, setForm, onClose }) {
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Inventory</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <form className="d-flex flex-column gap-3">
              <input
                className="form-control"
                name="account"
                value={form.account}
                onChange={handleChange}
                placeholder="Account"
              />
              <input
                className="form-control"
                name="product"
                value={form.product}
                onChange={handleChange}
                placeholder="Product"
              />
              <input
                type="number"
                className="form-control"
                name="stocks"
                value={form.stocks}
                onChange={handleChange}
                placeholder="Stocks"
              />
              <div className="input-group">
                <span className="input-group-text">₱</span>
                <input
                  type="number"
                  className="form-control"
                  name="price_each"
                  value={form.price_each}
                  onChange={handleChange}
                  placeholder="Price Each"
                />
              </div>
              <select
                className="form-select"
                name="inserted_by"
                value={form.inserted_by}
                onChange={handleChange}
              >
                <option value="" disabled hidden>
                  Added by
                </option>
                <option value="Ekong">Ekong</option>
                <option value="Ann">Ann</option>
              </select>
            </form>
          </div>

          <div className="modal-footer">
           <button
  type="button"
  className="btn btn-success"
  onClick={() => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Inventory created!",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
    onClose();
  }}
>
  Save
</button>


            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
