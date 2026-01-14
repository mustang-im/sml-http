import express from "express";
import cors from "cors";
import registerRouter from "./routes/register";
import confirmRouter from "./routes/confirm";
import meRouter from "./routes/me"; 
import resourcesRouter from "./routes/resources";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());



  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/register", registerRouter);
  app.use("/register/confirm", confirmRouter);
  app.use(resourcesRouter);
    app.use( meRouter);
  return app;
}
