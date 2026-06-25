const buildApp = require('./src/app');

const PORT = process.env.PORT || 3000;

buildApp().then((app) => {
    app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});