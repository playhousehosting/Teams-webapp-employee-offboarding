import fs from "fs";
import https from "https";
import path from "path";

import { App, HttpPlugin, IPlugin } from "@microsoft/teams.apps";
import { ConsoleLogger } from "@microsoft/teams.common/logging";
import { DevtoolsPlugin } from "@microsoft/teams.dev";
import { processAgenticMessage } from "./services/agentService";

const sslOptions = {
  key: process.env.SSL_KEY_FILE ? fs.readFileSync(process.env.SSL_KEY_FILE) : undefined,
  cert: process.env.SSL_CRT_FILE ? fs.readFileSync(process.env.SSL_CRT_FILE) : undefined,
};
const plugins: IPlugin[] = [new DevtoolsPlugin()];
if (sslOptions.cert && sslOptions.key) {
  plugins.push(new HttpPlugin(https.createServer(sslOptions)));
}
const app = new App({
  logger: new ConsoleLogger("tab", { level: "debug" }),
  plugins: plugins,
});

// Serve the static client
app.tab("home", path.join(__dirname, "./client"));

// Handle all message activities with agentic processing
app.on("message", async (context) => {
  const userMessage = context.activity.text || "";
  const userId = context.activity.from?.id || "default";
  
  console.log(`[INFO] Received message from ${userId}: ${userMessage}`);
  
  try {
    // Use agentic service with chain of thought reasoning
    const responseText = await processAgenticMessage(userMessage, userId);
    
    // Send response back
    await context.send({
      type: "message",
      text: responseText
    });
    
    console.log(`[INFO] Sent agentic response (${responseText.length} chars)`);
  } catch (error: any) {
    console.error("[ERROR]", error);
    await context.send({
      type: "message",
      text: `I apologize, but I encountered an error: ${error.message}. Please try again.`
    });
  }
});

(async () => {
  await app.start(+(process.env.PORT || 3978));
})();
