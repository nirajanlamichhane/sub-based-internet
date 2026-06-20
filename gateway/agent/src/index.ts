import "./env.js";
import { runAgent } from "./utils/agent.js";

runAgent().catch((err) => {
  console.error("[GatewayAgent] fatal:", err);
  process.exit(1);
});
