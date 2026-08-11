import { Hono } from "hono";
import v1Router from "@/routes/v1";

const apiRouter = new Hono();

apiRouter.route("/", v1Router);

export default apiRouter;
