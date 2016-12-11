const Q = require("q");

module.exports = function (url){
	const defer = Q.defer();

	console.log("top4top start parsing")

	defer.resolve(url);
	
	return defer.promise;
}