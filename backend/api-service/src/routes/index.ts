import { Hono } from "hono";
import v1Router from "./v1";

const apiRouter = new Hono();

apiRouter.route("/", v1Router);

export default apiRouter;
