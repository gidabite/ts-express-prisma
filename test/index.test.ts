import * as chaiModule from 'chai';
import chaiHttp from 'chai-http';

const chai = chaiModule.use(chaiHttp);

import app from '../src';

const auth = [
    process.env.BASIC_AUTH_LOGIN as string,
    process.env.BASIC_AUTH_PASSWORD as string,
] as const;

chai.should();

describe('Objects methods', function () {
    it('it should GET all the Objects', (done) => {
        const server = chai.request.execute(app).keepOpen();
        server
            .get('/object')
            .auth(...auth)
            .end((_, res) => {
                //console.log(res);
                res.should.have.status(200);
                res.body.should.be.a('array');
                done();
            });

        server.close();
    });
});
