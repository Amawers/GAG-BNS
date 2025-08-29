import html2canvas from "html2canvas";

export default function useSalesReport(dummyData) {
  const downloadSalesReportImage = async () => {
    const sales = dummyData.filter(d => d.action === "Sell");
    if (!sales.length) return alert("No sales to export.");

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

    let grandTotal = 0;
    sales.forEach(sale => {
      const totalTransaction = sale.items.reduce((sum, i) => sum + i.price_each * i.qty, 0);
      grandTotal += totalTransaction;

      const row = document.createElement("tr");
      [sale.reference, sale.process_by, sale.when, `₱${totalTransaction}`].forEach(v => {
        const td = document.createElement("td");
        td.innerText = v;
        td.style.border = "1px solid #333";
        td.style.padding = "5px";
        td.style.textAlign = "center";
        row.appendChild(td);
      });
      table.appendChild(row);
    });

    // grand total row
    const totalRow = document.createElement("tr");
    ["", "", "Grand Total", `₱${grandTotal}`].forEach((v) => {
      const td = document.createElement("td");
      td.innerText = v;
      td.style.border = "1px solid #333";
      td.style.padding = "5px";
      td.style.textAlign = "center";
      td.style.fontWeight = "bold"; // bold for Grand Total row
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
