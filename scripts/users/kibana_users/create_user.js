// =============================================================================
// 
// Author: Brett Bhate (slower)
// Purpose: Create Kibana user
//
// Node requirements:
//  $ npm install sync-request
//  $ npm install dotenv
//
// Run script
//     $ node create_user.js <user name> <environment>
//       environment:
//         prd for production environment
//          np for non-production environment
//         sbx for sandbox environment
// 
//       ELASTIC_ENV_PATH:
//          The location of .env file   
//
// Create a file called .env in directory pointed to by the environment variable ELASTIC_ENV_PATH
//
// ES_PRD_USERNAME=xxxx
// ES_PRD_PASSWORD=xxxx
// ES_PRD_ENV_URL=xxxx
// KB_PRD_USERNAME=xxxx
// KB_PRD_PASSWORD=xxxx
// KB_PRD_ENV_URL=xxxx
// 
// ES_NP_USERNAME=xxxx
// ES_NP_PASSWORD=xxxx
// ES_NP_ENV_URL=xxxx
// KB_NP_USERNAME=xxxx
// KB_NP_PASSWORD=xxxx
// KB_NP_ENV_URL=xxxx
// 
// ES_SBX_USERNAME=xxxx
// ES_SBX_PASSWORD=xxxx
// ES_SBX_ENV_URL=xxxx
// KB_SBX_USERNAME=xxxx
// KB_SBX_PASSWORD=xxxx
// KB_SBX_ENV_URL=xxxx
//
// =============================================================================
const creds = require('dotenv').config({path:process.env.ELASTIC_ENV_PATH})
var request = require('sync-request');
var fs = require('fs');


if (process.env.ELASTIC_ENV_PATH == null) {
	console.log("needs an environment variable to read .env file. You can set up this variable 'ELASTIC_ENV_PATH' two ways:")
	console.log("1. at the command prompt type: ELASTIC_ENV_PATH=<path to .env file> node create_user.js <user name> <environment>")
	console.log("2. set up a ELASTIC_ENV_PATH in .profile or .bash_profile or .zprofile based on your shell")
	console.log("open the .profile (based on your appropriate shell and do 'export ELASTIC_ENV_PATH='/path/to/env/file/.env'  ")
	console.log("In the 2 scenario, at the command prompt, just do:  node create_user.js <user name> <environment> ")
    process.exit(1)
}

if (process.argv.length != 4) {
	console.log("usage: node create_user.js <user name> <environment>")
    process.exit(2)
}

var myArgs = process.argv.slice(2);
var environ = myArgs[1]
let elastic_username, elastic_password, env_url

if (environ == 'prd') {
    elastic_username = process.env.KB_PRD_USERNAME;
    elastic_password = process.env.KB_PRD_PASSWORD;
    env_url = process.env.KB_PRD_ENV_URL;
} else if (environ == 'np'){
    elastic_username = process.env.KB_NP_USERNAME;
    elastic_password = process.env.KB_NP_PASSWORD;
    env_url = process.env.KB_NP_ENV_URL;
} else if (environ == 'sbx'){
    elastic_username = process.env.KB_SBX_USERNAME;
    elastic_password = process.env.KB_SBX_PASSWORD;
    env_url = process.env.KB_SBX_ENV_URL;
} else {
    console.log('invalid environment given please enter prd, np or sbx')
    process.exit(3)
}

// -----------------------------------------------------------------------------
// Define the base URL used in the Elasticsearch API calls
// -----------------------------------------------------------------------------
var base_user_api_url = env_url + '/_security/user/'

user_name = myArgs[0]
user_file_name = user_name + "_user.json"

try {
	var user_file = fs.readFileSync(user_file_name, 'utf8')
} catch (err) {
	console.log(err)
	process.exit(4)
}

try {
	user_obj = JSON.parse(user_file)
} catch(err) {
	console.log(err)
	process.exit(5)
}

// switch out the password with a random string
user_obj.password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

api_url = base_user_api_url + user_name
console.log(api_url)

update_elastic(api_url, user_obj)

// -----------------------------------------------------------------------------
// Call the Elasticsearch API that is passed to the method. The body of the API is 
// passed as a JSON object.
// -----------------------------------------------------------------------------
function update_elastic(api_url, json_obj) {
    auth = "Basic " + new Buffer.from(elastic_username + ":" + elastic_password).toString("base64");

	var response = request('PUT', api_url, {
		json: json_obj,
		headers: {
			"content-type": "application/json",
			"kbn-xsrf": true,
			"Authorization": auth
		}
	});

	try {
		var body = response.getBody('utf8');
	} catch(err) {
		console.log(err)
		process.exit(6)
	}

	try {
		var body_obj = JSON.parse(body)
	} catch(err) {
		console.log(err)
		process.exit(7)
	}

	console.log(body_obj)
}
