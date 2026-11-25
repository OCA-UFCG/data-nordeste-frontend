/**
 * Servidor MCP do assistente do Data Nordeste, usado pelo claude da linha de
 * comando (conversar.sh, a avaliação e a página de chat no motor "claude").
 * As ferramentas estão em ferramentas/, que também serve o motor da API.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { FERRAMENTAS } from "./ferramentas/index.ts";

const server = new McpServer({ name: "datane", version: "0.1.0" });

for (const f of FERRAMENTAS) {
  server.registerTool(f.nome, { title: f.titulo, description: f.descricao, inputSchema: f.entrada }, async (args: Record<string, unknown>) => ({
    content: [{ type: "text" as const, text: await f.executar(args as never, {}) }],
  }));
}

await server.connect(new StdioServerTransport());
