/** Inline SVG architecture diagrams for the case-study rows. Every box maps to a fact in the CV, story bank, or repos. */

const W = 400;

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L8 4 L0 8 z" fill="var(--ink)" />
      </marker>
    </defs>
  );
}

function Box({ x, y, w, h, lines, dashed, accent }: { x: number; y: number; w: number; h: number; lines: string[]; dashed?: boolean; accent?: boolean }) {
  const lh = 14;
  const top = y + h / 2 - ((lines.length - 1) * lh) / 2;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        fill="var(--card)"
        stroke={accent ? "var(--brand)" : "var(--ink)"}
        strokeWidth={accent ? 1.5 : 1}
        strokeDasharray={dashed ? "4 3" : undefined}
      />
      {lines.map((t, i) => (
        <text
          key={t}
          x={x + w / 2}
          y={top + i * lh}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={i === 0 ? 12.5 : 11.5}
          fill={i === 0 ? "var(--ink)" : "var(--ink-soft)"}
          fontFamily="var(--font-sans-x), sans-serif"
        >
          {t}
        </text>
      ))}
    </g>
  );
}

function Arrow({ d, id, dashed }: { d: string; id: string; dashed?: boolean }) {
  return <path d={d} fill="none" stroke="var(--ink)" strokeWidth={1} strokeDasharray={dashed ? "3 3" : undefined} markerEnd={`url(#${id})`} />;
}

function Caption({ x, y, children, anchor = "start" }: { x: number; y: number; children: string; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={10.5} letterSpacing="0.12em" fill="var(--ink-soft)" fontFamily="var(--font-mono-x), monospace">
      {children}
    </text>
  );
}

/** 01: telemetry (simplified). Top row is the team's monitoring stack, bottom row is the apps I own. */
export function TelemetryDiagram() {
  const id = "arr-tel";
  return (
    <svg viewBox={`0 0 ${W} 214`} className="h-auto w-full" role="img" aria-label="Telemetry: the team monitoring stack, internal services through OpenTelemetry to Prometheus, and the apps I own, Salesforce through Python and Go ingest apps to BigQuery, both feeding Grafana">
      <Defs id={id} />
      <Caption x={0} y={12}>TELEMETRY (SIMPLIFIED)</Caption>
      <Caption x={0} y={42}>TEAM MONITORING STACK</Caption>
      <Box x={0} y={50} w={82} h={46} lines={["Internal", "services"]} />
      <Box x={110} y={50} w={82} h={46} lines={["OTel", "OTLP"]} />
      <Box x={220} y={50} w={82} h={46} lines={["Prometheus"]} />
      <Caption x={0} y={128}>APPS I OWN</Caption>
      <Box x={0} y={136} w={82} h={46} lines={["Salesforce"]} />
      <Box x={110} y={136} w={82} h={46} lines={["Ingest apps", "Python, Go"]} accent />
      <Box x={220} y={136} w={82} h={46} lines={["BigQuery"]} />
      <Box x={328} y={50} w={72} h={132} lines={["Grafana", "dashboards"]} />
      <Arrow id={id} d="M82 73 H108" />
      <Arrow id={id} d="M192 73 H218" />
      <Arrow id={id} d="M82 159 H108" />
      <Arrow id={id} d="M192 159 H218" />
      <Arrow id={id} d="M302 73 H326" />
      <Arrow id={id} d="M302 159 H326" />
      <Caption x={0} y={204}>OUT: SLOS, CRITICAL USER JOURNEYS, ALERTS</Caption>
    </svg>
  );
}

/** 02: payments (simplified, generalized). */
export function PaymentsDiagram() {
  const id = "arr-pay";
  return (
    <svg viewBox={`0 0 ${W} 210`} className="h-auto w-full" role="img" aria-label="Payments: upstream clients to a card-authorization broker service, which validates, detects duplicates, and converts formats before sending to downstream processors; CockroachDB and a gift-card tender API sit alongside">
      <Defs id={id} />
      <Caption x={0} y={12}>AUTHORIZATION PATH (SIMPLIFIED)</Caption>
      <rect x={96} y={24} width={164} height={108} rx={6} fill="none" stroke="var(--ink-soft)" strokeDasharray="4 3" />
      <Caption x={104} y={38}>GO, GKE + PCF</Caption>
      <Box x={0} y={56} w={74} h={44} lines={["Upstream", "clients"]} />
      <Box x={108} y={46} w={140} h={80} lines={["Authorization broker", "validation, duplicates", "format conversion"]} accent />
      <Box x={290} y={56} w={110} h={44} lines={["Downstream", "processors"]} />
      <Arrow id={id} d="M74 78 H106" />
      <Arrow id={id} d="M248 78 H288" />
      <Box x={108} y={146} w={140} h={40} lines={["CockroachDB", "distributed SQL"]} />
      <Box x={290} y={146} w={110} h={40} lines={["Gift-card", "tender API"]} />
      <path d="M178 126 V146" stroke="var(--ink)" strokeWidth={1} />
    </svg>
  );
}

/** 03: SaucerJam architecture (simplified). Private repo; diagram only. */
export function SaucerDiagram() {
  const id = "arr-sj";
  return (
    <svg viewBox={`0 0 ${W} 210`} className="h-auto w-full" role="img" aria-label="SaucerJam: browser clients send inputs to a Node server that steps a shared fixed-step simulation and sends snapshots back; offline practice runs the same simulation in the browser">
      <Defs id={id} />
      <Caption x={0} y={12}>SAUCERJAM (SIMPLIFIED)</Caption>
      <Box x={0} y={30} w={104} h={72} lines={["Browser client", "Three.js", "prediction"]} />
      <Box x={176} y={30} w={104} h={72} lines={["Node server", "Socket.IO rooms", "validates input"]} accent />
      <Box x={330} y={30} w={70} h={72} lines={["Shared", "simulation", "60 Hz"]} />
      <Arrow id={id} d="M104 50 H174" />
      <Arrow id={id} d="M280 66 H328" />
      <Arrow id={id} d="M176 84 H106" dashed />
      <Caption x={139} y={44} anchor="middle">INPUTS</Caption>
      <Caption x={139} y={100} anchor="middle">20 HZ</Caption>
      <Box x={0} y={128} w={150} h={48} lines={["Offline practice", "same simulation"]} dashed />
      <Box x={168} y={128} w={232} h={48} lines={["Clients send inputs only", "damage and positions stay server-side"]} />
    </svg>
  );
}

/** inferencia: gateway routing (simplified, from the repo README). */
export function GatewayDiagram() {
  const id = "arr-gw";
  return (
    <svg viewBox={`0 0 ${W} 210`} className="h-auto w-full" role="img" aria-label="inferencia: an OpenAI-compatible request goes to a Go gateway that picks a healthy backend with the fewest in-flight requests, across Ollama, MLX, and TTS servers">
      <Defs id={id} />
      <Caption x={0} y={12}>INFERENCIA (SIMPLIFIED)</Caption>
      <Box x={0} y={50} w={84} h={56} lines={["Client", "OpenAI-", "compatible"]} />
      <Box x={116} y={36} w={112} h={84} lines={["inferencia", "Go gateway", "health-aware", "least in-flight"]} accent />
      <Box x={268} y={24} w={132} h={34} lines={["Ollama"]} />
      <Box x={268} y={68} w={132} h={34} lines={["MLX"]} />
      <Box x={268} y={112} w={132} h={34} lines={["TTS servers"]} />
      <Arrow id={id} d="M84 78 H114" />
      <Arrow id={id} d="M228 60 C248 60 248 41 266 41" />
      <Arrow id={id} d="M228 78 C248 78 248 85 266 85" />
      <Arrow id={id} d="M228 98 C248 98 248 129 266 129" />
      <Box x={116} y={150} w={284} h={38} lines={["Prometheus, Loki, OpenTelemetry, OpenAPI 3.1"]} dashed />
    </svg>
  );
}

/** This site's real stack, from the repo. */
export function SiteDiagram() {
  const id = "arr-site";
  return (
    <svg viewBox={`0 0 ${W} 210`} className="h-auto w-full" role="img" aria-label="This site: visitor, Cloudflare proxy, Next.js on Coolify, then the RAG worker, which uses Vectorize for retrieval and Workers AI for chat">
      <Defs id={id} />
      <Caption x={0} y={12}>THIS SITE, AS DEPLOYED</Caption>
      <Box x={0} y={30} w={80} h={48} lines={["Visitor"]} />
      <Box x={110} y={30} w={96} h={48} lines={["Cloudflare", "proxy"]} />
      <Box x={236} y={30} w={164} h={48} lines={["Next.js on Coolify", "free-tier cloud VM"]} accent />
      <Arrow id={id} d="M80 54 H108" />
      <Arrow id={id} d="M206 54 H234" />
      <Box x={236} y={110} w={164} h={44} lines={["RAG worker", "Cloudflare Worker"]} />
      <Arrow id={id} d="M318 78 V108" />
      <Box x={0} y={98} w={100} h={32} lines={["Vectorize"]} />
      <Box x={0} y={140} w={100} h={32} lines={["Workers AI"]} />
      <Arrow id={id} d="M236 126 H132 V114 H102" />
      <Arrow id={id} d="M236 140 H132 V156 H102" />
      <Caption x={0} y={196}>COUNTERS IN MEMORY, RESET ON RESTART</Caption>
    </svg>
  );
}

export const DIAGRAMS = { telemetry: TelemetryDiagram, payments: PaymentsDiagram, saucer: SaucerDiagram } as const;
