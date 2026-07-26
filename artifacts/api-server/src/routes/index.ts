import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pwRouter from "./pw";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/pw", pwRouter);

export default router;
