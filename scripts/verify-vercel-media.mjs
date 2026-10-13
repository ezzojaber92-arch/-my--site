const base = (process.argv[2] ?? "https://zomoolreserve.vercel.app").replace(/\/$/, "");
const media = [
  ["camel", "/media/IMG_7677_a10100ed_8a848c21.jpg"],
  ["logo", "/media/reserve-logo_7954e6d6.png"],
  ["video", "/media/v29044g50000d5ciac7og65i2dad18v0_e18747fd_36eaaa24.mp4"],
];
for (const [label, path] of media) {
  const response = await fetch(`${base}${path}`, { method: "HEAD", redirect: "follow" });
  console.log(`${label} ${response.status} ${(response.headers.get("content-type") ?? "").split(";")[0]}`);
}
