import { Hono } from "hono";
import authRouter from "../../modules/auth/auth.routes";
import githubRouter from "../../modules/github/github.routes";

const v1Router = new Hono();

v1Router.route("/auth", authRouter);
v1Router.route("/github", githubRouter);

export default v1Router;
