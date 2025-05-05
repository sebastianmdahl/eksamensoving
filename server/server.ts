import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono();
// `serveStatic` makes Hono serve the output from `vite build`
app.use("*", serveStatic({ root: "../dist" }));

// Heroku provides the port that the server should start on as an environment variable
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
serve({ fetch: app.fetch, port });
