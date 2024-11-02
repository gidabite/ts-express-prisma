import express from 'express';

import order from './order';

const router = express.Router().use(order);

export default router;
