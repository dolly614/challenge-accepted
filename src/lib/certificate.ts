import jsPDF from "jspdf";

export function generateCertificate(opts: {
  name: string;
  cls: string | number;
  score?: number;
  total?: number;
  rank?: number | string;
}) {
  const { name, cls, score, total = 30, rank } = opts;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(252, 250, 245);
  doc.rect(0, 0, W, H, "F");

  // Outer border (saffron)
  doc.setDrawColor(255, 153, 51);
  doc.setLineWidth(6);
  doc.rect(20, 20, W - 40, H - 40);
  // Inner border (green)
  doc.setDrawColor(19, 136, 8);
  doc.setLineWidth(2);
  doc.rect(34, 34, W - 68, H - 68);

  // Header bar
  doc.setFillColor(83, 74, 183);
  doc.rect(34, 34, W - 68, 56, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("30 Days Learning Challenge", W / 2, 70, { align: "center" });

  // Title
  doc.setTextColor(40, 40, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text("Certificate of Achievement", W / 2, 160, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(90, 90, 110);
  doc.text("This certificate is proudly presented to", W / 2, 200, { align: "center" });

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(29, 158, 117);
  doc.text(name || "Student", W / 2, 250, { align: "center" });

  // Underline
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(1);
  doc.line(W / 2 - 200, 262, W / 2 + 200, 262);

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(70, 70, 90);
  const body = `Class ${cls} • For successfully completing the 30 Days Learning Challenge${
    typeof score === "number" ? ` with a final score of ${score}/${total}` : ""
  }${rank ? ` and securing rank #${rank}` : ""}.`;
  doc.text(body, W / 2, 300, { align: "center", maxWidth: W - 160 });

  doc.setFontSize(12);
  doc.text(
    "Awarded for dedication, consistency and the spirit of learning. Seekho, Compete Karo, Jeeto!",
    W / 2,
    330,
    { align: "center", maxWidth: W - 160 },
  );

  // Date + signature lines
  const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  doc.setDrawColor(120, 120, 140);
  doc.line(120, H - 110, 280, H - 110);
  doc.line(W - 280, H - 110, W - 120, H - 110);
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 100);
  doc.text(date, 200, H - 92, { align: "center" });
  doc.text("Date", 200, H - 78, { align: "center" });
  doc.text("30 Days Challenge Team", W - 200, H - 92, { align: "center" });
  doc.text("Authorised Signatory", W - 200, H - 78, { align: "center" });

  // Footer ribbon
  doc.setFillColor(29, 158, 117);
  doc.rect(34, H - 56, W - 68, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("www.30dayschallenge.in", W / 2, H - 41, { align: "center" });

  doc.save(`30Days-Certificate-${(name || "student").replace(/\s+/g, "_")}.pdf`);
}