var sys = require('sys'),
    fs = require('fs'),
    url = require('url'),
    qs = require('querystring'),
    http = require('http');

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

var args = process.argv.slice(2, process.argv.length)

if (args.join( ).indexOf('-h') > -1){
    sys.puts('== Hammer Useage ==')
    sys.puts('')
    sys.puts('  node hammer.js method url num_clients num_requests_per_client')
    sys.puts('')
    sys.puts('  Example:')
    sys.puts('  node hammer.js GET http://localhost:8000/ 5 10000')
    return
}

if(args[0] == undefined || args[1] == undefined){
    sys.puts('Error: Requires a method and url.')
    return
}

var form_file, form = '';
for(var i=0; i < args.length; i++){
    if (args[i].indexOf('--form=') > -1) {
        form_file = args[i].split('=')[1];
        args[i] = null;
    }
}
// remove nulls
args = args.clean()



var request_method = args.shift() || 'GET'
var uri = url.parse(args.shift(), true)
if (uri.port === undefined){uri.port = 80}
// sys.puts(sys.inspect(uri))
var number_of_clients = args.shift() || 5;
var number_of_requests = args.shift() || 1000;

if (form_file){
    sys.puts('Loading form values: ' + form_file)
    form = require(form_file.replace('.js','')).data
    form = qs.stringify(form)
    sys.puts(sys.inspect(form))
}

// sys.puts(sys.inspect(args))

var proxy = http.createClient(uri.port, uri.hostname);
var requests = []
var errors = []
var procs = {}
var completed = {}

function request(method, path, proc_name, total){
    try{
        if (procs[proc_name] === undefined) {procs[proc_name] = 0}
        if (completed[proc_name] === undefined) {completed[proc_name] = false}
    
        var proxy_req;
        
        if (method=='POST') {
            proxy_req = proxy.request(method, path, {'host': uri.hostname, 
                                                    'port': uri.port, 
                                                    'content-type':'application/x-www-form-urlencoded',
                                                    'content-length':form.length});
            proxy_req.write(form)

        } else {
            proxy_req = proxy.request(method, path, {'host': uri.hostname, 'port': uri.port});
            
        }
        
        proxy_req.start_at = new Date();
        // sys.puts(sys.inspect(proxy_req))
        proxy_req.end();
        proxy_req.on('response', function (proxy_res) {
        
            proxy_res.on('data', function (chunk) {
                    proxy_req.end_at = new Date();
                    var stat = {'request': proc_name + ':' + procs[proc_name], 'start_at': proxy_req.start_at, 'end_at': proxy_req.end_at}
                    requests.push(stat)
                    procs[proc_name] += 1

                    // sys.puts(sys.inspect(stat))
                    if (procs[proc_name] < total) {
                        // sys.puts(proc_name + ':' + procs[proc_name])
                        sys.print('.')
                        try{
                            request(method, path, proc_name, total)
                        } catch(e){
                            errors.push('error')
                        }
                    } else {
                        completed[proc_name] = true
                    }
            });
            proxy_res.on('end', function (){

            });

        });
    } catch(e){
        errors.push('error')
    }
}
function done(){
    // sys.puts(sys.inspect(completed))
    for (var prop in completed){
        if (!completed[prop]) {
            setTimeout(done, 100)
            return
        }
    }
    sys.puts(' Finished!')
    var total = 0, time, start_at, rps = {};
    requests.forEach(function(item){
        start_at = item.start_at.getTime() - item.start_at.getMilliseconds()
        if (rps[start_at] === undefined) {
            rps[start_at] = 1
        } else {
            rps[start_at] += 1
        }
        time = (item.end_at.getTime() - item.start_at.getTime()) / 1000
        total += time;
    })
    
    var rps_count = 0, rps_total = 0;
    for (var prop in rps){
        rps_total += 1
        rps_count += rps[prop]
    }

    sys.puts('------------')
    sys.puts('Request method: ' + request_method)
    sys.puts('Request uri: ' + uri.href)
    sys.puts('Num of clients: ' + number_of_clients)
    sys.puts('Requests per client: ' + number_of_requests)
    sys.puts('------------')
    sys.puts('Total requests: ' + requests.length)
    sys.print('Average response time: ') 
    sys.puts(total / requests.length + ' (ms)')
    sys.puts('Requests per second: ' + (rps_count / rps_total))
    sys.puts('Errors: ' + errors.length)
    sys.puts('------------')
    
    return
}

function now(){
    var d = new Date();
    return d.getTime() / 1000
}

var request_path = uri.pathname
if (uri.search) {
    request_path += uri.search
}
if (request_method=='GET') {
    if(request_path.indexOf('?') > -1) {
        request_path += '&' + form
    } else {
        request_path += '?' + form
    }
}
for(var i=0; i < number_of_clients; i++){
    try{request(request_method, request_path, 'client_' + i, number_of_requests)} catch(e){}
}
done()
