import { Router } from 'express';
import { queueStats, healthServer, healthDB, healthWorker, healthRedis } from '../controller/health.controller';
const router = Router();
router.get("/", healthServer);
router.get('/db', healthDB);
router.get('/worker', healthWorker);
router.get('/redis', healthRedis);
router.get('/queue/stats', queueStats)
export default router