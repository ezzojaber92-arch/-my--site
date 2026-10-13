import { jsPDF } from "jspdf";
import "svg2pdf.js";

export function qrFileStem(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "zomool-qr";
}

function getPrintableSvg(svgId: string) {
  const source = document.getElementById(svgId);
  if (!(source instanceof SVGSVGElement)) throw new Error("QR SVG was not found");
  const copy = source.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copy.setAttribute("width", "1024");
  copy.setAttribute("height", "1024");
  return copy;
}

export function downloadQrSvg(svgId: string, name: string) {
  const svg = getPrintableSvg(svgId);
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${qrFileStem(name)}-qr.svg`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadQrPdf(svgId: string, name: string) {
  const svg = getPrintableSvg(svgId);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await pdf.svg(svg, { x: 30, y: 36, width: 150, height: 150 });
  pdf.setFontSize(15);
  pdf.text(`QR — ${qrFileStem(name)}`, 105, 204, { align: "center" });
  pdf.save(`${qrFileStem(name)}-qr.pdf`);
}
