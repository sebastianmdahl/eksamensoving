import { Hono } from "hono";
import { serve } from "@hono/node-server";
import pg from "pg";
import { serveStatic } from "@hono/node-server/serve-static";

// When you run `heroku addons:create heroku-postgresql` (below),
// Heroku will provide `DATABASE_URL` as an envionment variable.
// If this doesn't exist, we assume we're running on localhost with docker-compose
const connectionString = process.env.DATABASE_URL;
const postgresql = connectionString
  ? new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  : // If you choose a diffent password in `docker-compose.yaml` you must update here as well
    new pg.Pool({ user: "postgres", password: "postgres" });

const app = new Hono();
app.get("/api/kommuner", async (c) => {
  const result = await postgresql.query(
    "select kommunenummer, kommunenavn, st_transform(st_simplify(omrade, 100), 4326)::json as geometry from kommune",
  );
  return c.json({
    type: "FeatureCollection",
    crs: { type: "name", properties: { name: "ESPG:4326" } },
    features: result.rows.map(
      // Returns GeoJSON features where each feature has the geometry from the SQL
      //  and includes all additional columns in the query as properties
      ({ geometry: { coordinates, type }, ...properties }) => ({
        type: "Feature",
        geometry: { type, coordinates },
        properties,
      }),
    ),
  });
});
app.use("*", serveStatic({ root: "../dist" }));

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
serve({ fetch: app.fetch, port });
