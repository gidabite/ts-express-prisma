import express from 'express';

import object from './object';
import payment from './payment';

const router = express.Router().use(object).use(payment);

export default router;
