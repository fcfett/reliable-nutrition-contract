import { serve } from "bun";
import index from "./index.html";

const server = serve({
  port: 3001,
  routes: {
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Frontend running at ${server.url}`);
