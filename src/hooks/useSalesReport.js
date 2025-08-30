import html2canvas from "html2canvas";

export default function useSalesReport(logs) {
  const downloadSalesReportImage = async () => {
    // Prepare sales logs with items
   const sales = logs
  .filter(d => d.action === "Sold" || d.action === "Reserved → Sold")
      .map(log => {
        const reservation = log["RESERVATION DETAIL"]?.[0];
        let items = [];

        if (log["SOLD ITEM"]?.length > 0) {
          items = log["SOLD ITEM"].map(i => ({
            account_name: i.account_name,
            product_name: i.product_name,
            price_each: i.price_each,
            qty: i.quantity,
          }));
        } else if (reservation?.["RESERVED PRODUCT"]?.length > 0) {
          items = reservation["RESERVED PRODUCT"].map(i => ({
            account_name: i.account_name,
            product_name: i.product_name,
            price_each: i.price_each,
            qty: i.quantity,
          }));
        }

        return { ...log, items };
      });

    if (!sales.length) return alert("No sales to export.");

    let grandTotal = 0;

    // Create container for html2canvas
    const container = document.createElement("div");
    container.style.padding = "20px";
    container.style.background = "#fff";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.width = "600px";

    const title = document.createElement("h2");
    title.innerText = `Sales Report - ${new Date().toLocaleDateString()}`;
    title.style.textAlign = "center";
    container.appendChild(title);

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.marginTop = "20px";

    // Table header
    const headerRow = document.createElement("tr");
    ["Reference", "Processed By", "Date", "Total Transaction Sale"].forEach(h => {
      const th = document.createElement("th");
      th.innerText = h;
      th.style.border = "1px solid #333";
      th.style.padding = "5px";
      th.style.background = "#1F4E78";
      th.style.color = "#fff";
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Table rows
    sales.forEach(sale => {
      const totalTransaction = sale.items.reduce(
        (sum, i) => sum + i.price_each * i.qty,
        0
      );
      grandTotal += totalTransaction;

      const row = document.createElement("tr");
      [sale.reference_number || "-", sale.process_by || "-", new Date(sale.when).toLocaleString(), `₱${totalTransaction}`].forEach(v => {
        const td = document.createElement("td");
        td.innerText = v;
        td.style.border = "1px solid #333";
        td.style.padding = "5px";
        td.style.textAlign = "center";
        row.appendChild(td);
      });
      table.appendChild(row);
    });

    // Grand total row
    const totalRow = document.createElement("tr");
    ["", "", "Grand Total", `₱${grandTotal}`].forEach(v => {
      const td = document.createElement("td");
      td.innerText = v;
      td.style.border = "1px solid #333";
      td.style.padding = "5px";
      td.style.textAlign = "center";
      td.style.fontWeight = "bold";
      td.style.background = "#d4edda";
      totalRow.appendChild(td);
    });
    table.appendChild(totalRow);

    container.appendChild(table);
    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    const link = document.createElement("a");
    link.href = imgData;
    link.download = `Sales_Report_${new Date().toISOString().slice(0,10)}.jpeg`;
    link.click();

    document.body.removeChild(container);
  };

  return { downloadSalesReportImage };
}
