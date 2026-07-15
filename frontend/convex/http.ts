import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Raw-bytes bridge for the FastAPI backend: ctx.storage.store() needs the
// actual request body, which the `convex` Python client's JSON-args RPC
// interface (mutation/query) can't carry — so this one operation goes over
// plain HTTP instead, guarded by a shared secret rather than Convex Auth
// (the backend has no end-user session to present).
http.route({
  path: "/backend/storeFile",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get("x-backend-secret");
    if (!secret || secret !== process.env.BACKEND_UPLOAD_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (!request.body) {
      return new Response("Missing request body", { status: 400 });
    }
    const blob = await request.blob();
    const storageId = await ctx.storage.store(blob);
    return Response.json({ storageId });
  }),
});

export default http;
