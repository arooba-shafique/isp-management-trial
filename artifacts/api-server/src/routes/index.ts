import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import packagesRouter from "./packages";
import customersRouter from "./customers";
import subscriptionsRouter from "./subscriptions";
import paymentsRouter from "./payments";
import complaintsRouter from "./complaints";
import announcementsRouter from "./announcements";
import dashboardRouter from "./dashboard";
import zonesRouter from "./zones";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(packagesRouter);
router.use(customersRouter);
router.use(subscriptionsRouter);
router.use(paymentsRouter);
router.use(complaintsRouter);
router.use(announcementsRouter);
router.use(dashboardRouter);
router.use(zonesRouter);

export default router;
