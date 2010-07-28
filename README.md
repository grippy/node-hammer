Use this lib to issue requests against the some url. You can define the number of simultaneous clients and how many requests they'll issue. You wanna submit form variables with your requests? No, problem.

## Hammer Time!

See help: 

	$ node hammer.js --help 

This command fires up 5 clients and issues 10K requests per client.
	
Run command: 

	$ node hammer.js GET http://localhost:8000/ 5 10000

## Form Parameters
If you need to submit form variables then create a file and place it in the form directory. The data object is then copied to either the querystring (GET) or body (POST) for each request.
	
Example from test.js: 

	exports.data = {'foo':'bar'}

Run command: 

	$ node hammer.js POST http://localhost:8000/ 5 10000 --form=./form/test.js

## Simple Report
When the process finishes, you'll see a report like this:

	Request method: POST
	Request uri: http://localhost:8000/
	Num of clients: 5
	Requests per client: 1000

	Total requests: 5000
	Average response time: 0.0059382000000001295 (ms)
	Requests per second: 714.2857142857143
	Errors: 0
