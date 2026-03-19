#!/usr/bin/env node
/**
 * LinkedIn MCP Server
 * Provides Claude with tools to interact with LinkedIn via the official API.
 *
 * Required env vars:
 *   LINKEDIN_ACCESS_TOKEN  – OAuth 2.0 bearer token
 *   LINKEDIN_CLIENT_ID     – from LinkedIn Developer App
 *   LINKEDIN_CLIENT_SECRET – from LinkedIn Developer App
 *
 * Setup:
 *   1. Create a LinkedIn App at https://www.linkedin.com/developers/apps
 *   2. Enable products: Sign In with LinkedIn, Share on LinkedIn, Marketing Developer Platform
 *   3. Run `node mcp/oauth-setup.js` to get your access token
 *   4. Add token to .env file
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

const BASE_URL = "https://api.linkedin.com/v2";
const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

async function liRequest(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn API ${res.status}: ${err}`);
  }
  return res.json();
}

const server = new Server(
  { name: "linkedin-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "linkedin_get_profile",
      description: "Get your own LinkedIn profile info (name, headline, connections count)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "linkedin_get_inbox",
      description: "Fetch recent LinkedIn messages/conversations",
      inputSchema: {
        type: "object",
        properties: {
          count: { type: "number", description: "Number of conversations to fetch (default 20)" },
        },
      },
    },
    {
      name: "linkedin_send_message",
      description: "Send a message to an existing LinkedIn connection",
      inputSchema: {
        type: "object",
        required: ["recipient_urn", "message"],
        properties: {
          recipient_urn: { type: "string", description: "LinkedIn URN of recipient e.g. urn:li:person:ABC123" },
          message: { type: "string", description: "Message text to send" },
        },
      },
    },
    {
      name: "linkedin_search_people",
      description: "Search for LinkedIn members by keywords, company, or title",
      inputSchema: {
        type: "object",
        required: ["keywords"],
        properties: {
          keywords: { type: "string", description: "Search keywords" },
          company: { type: "string", description: "Filter by company name" },
          title: { type: "string", description: "Filter by job title" },
          count: { type: "number", description: "Number of results (default 10)" },
        },
      },
    },
    {
      name: "linkedin_get_connection_requests",
      description: "Fetch pending connection requests sent or received",
      inputSchema: {
        type: "object",
        properties: {
          direction: {
            type: "string",
            enum: ["sent", "received"],
            description: "Sent or received requests (default: received)",
          },
        },
      },
    },
    {
      name: "linkedin_share_post",
      description: "Share a post on LinkedIn",
      inputSchema: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string", description: "Post content (max 3000 chars)" },
          visibility: {
            type: "string",
            enum: ["PUBLIC", "CONNECTIONS"],
            description: "Who can see this post (default: PUBLIC)",
          },
        },
      },
    },
    {
      name: "linkedin_get_post_analytics",
      description: "Get engagement analytics for your recent posts",
      inputSchema: {
        type: "object",
        properties: {
          count: { type: "number", description: "Number of posts to analyse (default 5)" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "linkedin_get_profile": {
        const profile = await liRequest("/me?projection=(id,firstName,lastName,headline,numConnections)");
        return {
          content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
        };
      }

      case "linkedin_get_inbox": {
        const count = args.count || 20;
        const data = await liRequest(`/messages?count=${count}&q=mboxName&mboxName=INBOX`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "linkedin_send_message": {
        const body = {
          recipients: { values: [{ person: { _path: `/people/${args.recipient_urn}` } }] },
          subject: "Message via Claude",
          body: args.message,
        };
        await liRequest("/messages", "POST", body);
        return {
          content: [{ type: "text", text: `Message sent to ${args.recipient_urn}` }],
        };
      }

      case "linkedin_search_people": {
        const params = new URLSearchParams({
          q: "people",
          keywords: args.keywords,
          count: String(args.count || 10),
        });
        if (args.company) params.append("facetCompany", args.company);
        if (args.title) params.append("facetTitle", args.title);
        const data = await liRequest(`/search/blended?${params}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "linkedin_get_connection_requests": {
        const dir = args.direction || "received";
        const data = await liRequest(`/invitations?direction=${dir.toUpperCase()}&count=20`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "linkedin_share_post": {
        const profile = await liRequest("/me?projection=(id)");
        const body = {
          author: `urn:li:person:${profile.id}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: args.text },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": args.visibility || "PUBLIC",
          },
        };
        const result = await liRequest("/ugcPosts", "POST", body);
        return {
          content: [{ type: "text", text: `Post published: ${JSON.stringify(result)}` }],
        };
      }

      case "linkedin_get_post_analytics": {
        const count = args.count || 5;
        const profile = await liRequest("/me?projection=(id)");
        const posts = await liRequest(`/ugcPosts?q=authors&authors=List(urn:li:person:${profile.id})&count=${count}`);
        return {
          content: [{ type: "text", text: JSON.stringify(posts, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

async function main() {
  if (!ACCESS_TOKEN) {
    console.error("ERROR: LINKEDIN_ACCESS_TOKEN is not set. See mcp/oauth-setup.js for setup instructions.");
    process.exit(1);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("LinkedIn MCP server running");
}

main();
