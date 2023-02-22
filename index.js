/**
 * IMPORTANT: This app isn't an example of how to correctly
 * set up a Financial Times Express application – it's used
 * to illustrate how to integrate Reliability Kit into an
 * express app with as little boilerplate code as possible.
 */

const express = require('express');
const createErrorLogger = require('@dotcom-reliability-kit/middleware-log-errors');
const createErrorRenderingMiddleware = require('@dotcom-reliability-kit/middleware-render-error-info');
const { HttpError, OperationalError } = require('@dotcom-reliability-kit/errors');
const { logRecoverableError } = require('@dotcom-reliability-kit/log-error');
const registerCrashHandler = require('@dotcom-reliability-kit/crash-handler');

/**
 * Reliability Kit method to ensure that fatal exceptions are logged.
 * The earlier this is called in your app, the more likely it is to
 * catch errors.
 *
 * @see https://github.com/Financial-Times/dotcom-reliability-kit/tree/main/packages/crash-handler#readme
 */
registerCrashHandler();

/**
 * Create an express application. Reliability Kit will work with
 * regular Express as well as the FT's wrappers (e.g. n-express)
 */
const app = express();

/**
 * Define a home view. This is just here to link to the various
 * error pages in the app so that you can see something when you
 * visit the locally running app.
 * 
 * @see http://localhost:3000/
 */
app.get('/', (request, response) => {
	response.send(`
		<h1>Reliability Kit: Example Express App</h1>

		<h2>HTTP Errors</h2>
		<p>These pages throw errors with HTTP status codes.</p>
		<ul>
			<li><a href="/http/500">Page throwing a 500 HTTP error</a></li>
			<li><a href="/http/503">Page throwing a 503 HTTP error</a></li>
			<li><a href="/http/400">Page throwing a 400 HTTP error</a></li>
			<li><a href="/http/403">Page throwing a 403 HTTP error</a></li>
		</ul>

		<h2>Recoverable Errors</h2>
		<p>These pages have errors which are recoverable and only visible in the logs.</p>
		<ul>
			<li><a href="/recoverable">Page throwing a recoverable error</a></li>
		</ul>
	`);
});

/**
 * This route sents an HTTP error with the given status code. The error
 * will be logged with Reliability Kit (check your terminal output) and
 * also produce a nice FT-styled error page when running in development.
 * 
 * @see http://localhost:3000/http/500
 */
app.get('/http/:statusCode', (request) => {
	throw new HttpError({
		statusCode: Number(request.params.statusCode) || 500
	});
});

/**
 * This route throws an error but then catches it and logs it as a
 * recoverable error. The page will still render "OK" but there will
 * be a warning-level log (check your terminal output).
 * 
 * @see http://localhost:3000/recoverable
 * @see https://github.com/Financial-Times/dotcom-reliability-kit/tree/main/packages/log-error#readme
 */
app.get('/recoverable', (request, response) => {
	try {
		throw new OperationalError('Something went wrong', {
			code: 'SOMETHING_WENT_WRONG',
			relatesToSystems: ['example-system']
		});
	} catch (/** @type {any} */ error) {
		logRecoverableError({ error, request });
		response.send('OK');
	}
});

/**
 * Here we're registering the error logging middleware. In an Express
 * app, this should be after all your application routes. This ensures
 * that any errors which are thrown during a request/response cycle are
 * logged in a consistent way.
 * 
 * @see https://github.com/Financial-Times/dotcom-reliability-kit/tree/main/packages/middleware-log-errors#readme
 */
app.use(createErrorLogger());

/**
 * This middleware will render a nice error page when you're running
 * in local development, helping you to debug any issues. This must
 * be the last middleware mounted in your app.
 * 
 * @see https://github.com/Financial-Times/dotcom-reliability-kit/tree/main/packages/middleware-render-error-info#readme
 */
app.use(createErrorRenderingMiddleware());

/**
 * Let's start the app!
 */
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
	console.log('Example application started');
	console.log(`Visit http://localhost:${port}/`);
});
