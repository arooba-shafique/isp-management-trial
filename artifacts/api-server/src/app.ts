import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { checkTrialExpired } from "./middlewares/trial";

const app: Express = express();

// @ts-ignore
app.use(
  // @ts-ignore
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: [
      "https://isp-management-isp-portal.vercel.app",
      "https://isp-management-trial.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes (no trial check)
app.use("/api", (req, res, next) => {
  const publicPaths = ["/health", "/auth/", "/public/", "/trial/status", "/trial/settings"];
  if (publicPaths.some(p => req.path.startsWith(p))) {
    next();
  } else {
    checkTrialExpired(req, res, next);
  }
});

app.use("/api", router);

export default app;
