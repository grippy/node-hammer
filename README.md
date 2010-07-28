 Use this lib to issue requests against the same url. You can define the number of simultaneous clients and how many requests they'll issue. You wanna submit form variables with your requests? No, problem.

## Hammer Time!

	node hammer.js --help 
	
	
	node hammer.js GET http://localhost:8000/ 5 10000
