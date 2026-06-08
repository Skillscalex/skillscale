"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Circle, Loader2, Radio, Send, Server, Sparkles } from "lucide-react";

type Agent = {
  id: string;
  name: string;
  role: string;
  provider: string;
  model: string;
  status: string;
  mode: "live" | "fallback" | "local";
  description: string;
  capabilities: string[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  agentId?: string;
};

const FALLBACK_AGENTS: Agent[] = [
  {
    id: "aria",
    name: "Aria",
    role: "Generalist",
    provider: "local",
    model: "local-studio-mode",
    status: "online",
    mode: "local",
    description: "Local fallback assistant for Studio when provider keys are not configured.",
    capabilities: ["marketplace guidance", "planning", "writing"],
  },
  {
    id: "byte",
    name: "Byte",
    role: "Code",
    provider: "local",
    model: "local-studio-mode",
    status: "online",
    mode: "local",
    description: "Local fallback code assistant for Studio diagnostics.",
    capabilities: ["TypeScript", "debugging", "architecture"],
  },
];

function modeLabel(mode: Agent["mode"]) {
  if (mode === "live") return "Live";
  if (mode === "fallback") return "Fallback";
  return "Local";
}

export default function StudioPage() {
  const [agents, setAgents] = useState<Agent[]>(FALLBACK_AGENTS);
  const [activeAgentId, setActiveAgentId] = useState("aria");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      agentId: "aria",
      content: "Studio is ready. Ask an agent for research, writing, code help, or skill coaching.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [sending, setSending] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "fallback">("checking");
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const activeAgent = useMemo(
    () => agents.find((agent) => agent.id === activeAgentId) ?? agents[0],
    [activeAgentId, agents]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/studio/agents", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("agents unavailable");
        return res.json();
      })
      .then((json) => {
        if (Array.isArray(json.agents) && json.agents.length) {
          setAgents(json.agents);
          setActiveAgentId((current) => json.agents.some((agent: Agent) => agent.id === current) ? current : json.agents[0].id);
          setApiStatus("ok");
        }
      })
      .catch(() => {
        setAgents(FALLBACK_AGENTS);
        setApiStatus("fallback");
      })
      .finally(() => setLoadingAgents(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    const history = messages
      .filter((item) => item.content.trim())
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: message }, { role: "assistant", agentId: activeAgent.id, content: "" }]);

    try {
      const res = await fetch("/api/studio/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, agentId: activeAgent.id, conversationHistory: history }),
      });

      if (!res.ok || !res.body) throw new Error(`Studio chat returned HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk.split("\n").find((part) => part.startsWith("data: "));
          if (!line) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.type === "token" && typeof payload.content === "string") {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = { ...last, content: last.content + payload.content };
              return next;
            });
          }
          if (payload.type === "error") throw new Error(payload.error ?? "Studio stream error");
        }
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Studio chat request failed";
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          agentId: activeAgent.id,
          content: `Studio local fallback handled the request path, but the live chat request failed: ${text}`,
        };
        return next;
      });
      setApiStatus("fallback");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="studio-shell">
      <section className="studio-header">
        <div>
          <div className="studio-kicker"><Sparkles size={16} /> Skillscale Studio</div>
          <h1>Agent Workspace</h1>
          <p>Chat with live Skillscale agents, stream responses, and keep working even when provider keys are not configured.</p>
        </div>
        <div className="studio-status" aria-label="Studio backend status">
          <Server size={18} />
          <span>{loadingAgents ? "Checking" : apiStatus === "ok" ? "API ready" : "Local fallback"}</span>
        </div>
      </section>

      <div className="studio-layout">
        <aside className="studio-agents glass" aria-label="Available agents">
          <div className="studio-panel-title">
            <Radio size={17} />
            <span>Agents</span>
          </div>
          <div className="studio-agent-list">
            {agents.map((agent) => (
              <button
                key={agent.id}
                className={agent.id === activeAgent.id ? "studio-agent active" : "studio-agent"}
                onClick={() => setActiveAgentId(agent.id)}
              >
                <span className="studio-agent-icon"><Bot size={18} /></span>
                <span>
                  <strong>{agent.name}</strong>
                  <small>{agent.role} · {modeLabel(agent.mode)}</small>
                </span>
                <Circle size={10} fill={agent.status === "online" ? "#00a66a" : "#9b7fa8"} />
              </button>
            ))}
          </div>
        </aside>

        <section className="studio-chat glass">
          <div className="studio-chat-top">
            <div>
              <h2>{activeAgent.name}</h2>
              <p>{activeAgent.description}</p>
            </div>
            <span>{activeAgent.provider} · {activeAgent.model}</span>
          </div>

          <div className="studio-messages" ref={scrollerRef}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`studio-message ${message.role}`}>
                <span>{message.role === "user" ? "You" : agents.find((agent) => agent.id === message.agentId)?.name ?? "Agent"}</span>
                <p>{message.content || (sending && index === messages.length - 1 ? "Thinking..." : "")}</p>
              </div>
            ))}
          </div>

          <form className="studio-composer" onSubmit={sendMessage}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Message ${activeAgent.name}`}
              aria-label={`Message ${activeAgent.name}`}
            />
            <button type="submit" disabled={sending || !input.trim()} aria-label="Send message">
              {sending ? <Loader2 size={18} className="studio-spin" /> : <Send size={18} />}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
