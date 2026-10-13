import type { IncomingMessage, ServerResponse } from "node:http";

export default function health(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify({ status: "ok" }));
}
