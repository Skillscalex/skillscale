import http from "node:http";
import { randomUUID } from "node:crypto";

const { WebSocketServer } = require("ws") as typeof import("ws");
type WebSocket = import("ws").WebSocket;

type ClientMessage = {
  type: "auth" | "job" | "cancel";
  agent?: "video" | "content" | "research" | "coach";
  payload?: Record<string, unknown>;
  jobId?: string;
  token?: string;
};

const port = Number(process.env.WS_PORT ?? 3001);

function send(ws: WebSocket, data: Record<string, unknown>) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function handleJob(ws: WebSocket, message: ClientMessage) {
  const jobId = message.jobId ?? randomUUID();
  const agent = message.agent ?? "content";
  const topic = String(message.payload?.topic ?? message.payload?.message ?? "Skillscale request");

  if (agent === "video") {
    const stages = ["researching", "scripting", "tts", "visuals", "assembly", "uploading", "done"];
    stages.forEach((stage, index) => {
      setTimeout(() => {
        send(ws, {
          type: stage === "done" ? "result" : "progress",
          jobId,
          progress: { percent: Math.round(((index + 1) / stages.length) * 100), stage, message: `VideoAgent ${stage}` },
          result: stage === "done" ? { url: null, message: "Video pipeline is reachable. Configure provider/storage keys for production rendering." } : undefined,
        });
      }, index * 250);
    });
    return;
  }

  const content = `${agent} agent backend is reachable for "${topic}". Configure provider-specific API keys to replace this health response with live generation.`;
  for (const [index, token] of (content.match(/\S+\s*/g) ?? [content]).entries()) {
    setTimeout(() => send(ws, { type: "token", jobId, content: token }), index * 20);
  }
  setTimeout(() => send(ws, { type: "result", jobId, result: { ok: true, agent } }), content.length + 250);
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      agents: { video: true, content: true, research: true, coach: true },
      mode: process.env.ANTHROPIC_API_KEY ? "live-ready" : "local-health",
    }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  send(ws, { type: "result", jobId: "connection", result: { status: "connected" } });

  ws.on("message", (raw) => {
    try {
      const message = JSON.parse(String(raw)) as ClientMessage;
      if (message.type === "auth") {
        send(ws, { type: "result", jobId: "auth", result: { authenticated: Boolean(message.token), mode: message.token ? "session" : "anonymous" } });
        return;
      }
      if (message.type === "cancel") {
        send(ws, { type: "result", jobId: message.jobId ?? "cancel", result: { cancelled: true } });
        return;
      }
      if (message.type === "job") {
        handleJob(ws, message);
      }
    } catch (error) {
      send(ws, { type: "error", jobId: "unknown", error: error instanceof Error ? error.message : "Invalid message" });
    }
  });
});

server.listen(port, () => {
  console.log(`Skillscale agent server listening on http://localhost:${port}`);
});
