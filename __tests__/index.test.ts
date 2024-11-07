import { describe, expect,test } from '@jest/globals';
import request from 'supertest';

import app from '../src';

describe('Post Endpoints', () => {
    it('should create a new post', async () => {
        const res = await request(app).post('/api/posts').send({
            userId: 1,
            title: 'test is cool',
        });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('post');
    });
});
