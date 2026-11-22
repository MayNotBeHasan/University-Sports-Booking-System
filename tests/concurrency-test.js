const http = require('http');

const TOTAL_REQUESTS = 50;
const SLOT_ID = 6703;  /* change this number to anythins */

function login() {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            email: 'student3@university.edu',
            password: 'Test1234'
        });

        const request = http.request(
            {
                hostname: 'localhost',
                port: 5000,
                path: '/api/auth/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            },
            (response) => {
                let data = '';

                response.on('data', chunk => {
                    data += chunk;
                });

                response.on('end', () => {
                    if (response.statusCode !== 200) {
                        reject(new Error(`Login failed: ${data}`));
                        return;
                    }

                    resolve(JSON.parse(data).token);
                });
            }
        );

        request.on('error', reject);
        request.write(body);
        request.end();
    });
}

function book(token) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            slot_id: SLOT_ID
        });

        const request = http.request(
            {
                hostname: 'localhost',
                port: 5000,
                path: '/api/bookings',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            },
            (response) => {
                let data = '';

                response.on('data', chunk => {
                    data += chunk;
                });

                response.on('end', () => {
                    resolve({
                        status: response.statusCode,
                        body: data
                    });
                });
            }
        );

        request.on('error', reject);
        request.write(body);
        request.end();
    });
}

async function main() {
    console.log(`Starting concurrency test with ${TOTAL_REQUESTS} requests...`);

    const token = await login();

    const requests = [];

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        requests.push(book(token));
    }

    const results = await Promise.all(requests);

    const successful = results.filter(result => result.status === 201);
    const conflicts = results.filter(result => result.status === 409);
    const serverErrors = results.filter(result => result.status >= 500);

    console.log('');
    console.log(`201 Created: ${successful.length}`);
    console.log(`409 Conflict: ${conflicts.length}`);
    console.log(`500+ Errors: ${serverErrors.length}`);
    console.log(`Other: ${results.length - successful.length - conflicts.length - serverErrors.length}`);

    if (
        successful.length === 1 &&
        conflicts.length === TOTAL_REQUESTS - 1 &&
        serverErrors.length === 0
    ) {
        console.log('');
        console.log('PASS: Exactly one booking succeeded.');
    } else {
        console.log('');
        console.log('FAIL: Concurrency requirement was not satisfied.');
    }
}

main().catch(error => {
    console.error('Test failed:', error.message);
});
