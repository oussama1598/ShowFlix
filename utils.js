'use strict'

const merge = require('lodash').merge
const inquirer = require('inquirer')
const Q = require("q")
const request = require("request")
const cheerio = require("cheerio")

module.exports = {
	ask,
	getHtml
}

function ask (question) {
  if (question.type === 'list') {
    // Append separator at end of list to mark end of list
    question = merge({}, question, {
      choices: question.choices.concat([new inquirer.Separator])
    })
  }

  return inquirer.prompt([merge({ name: 'answer' }, question)]).then(answers => answers.answer)
}

ask.confirm = function (message, def) {
  return ask({ type: 'confirm', message, default: def })
}

ask.list = function (message, choices, def) {
  return ask({ type: 'list', message, choices, default: def })
}

ask.input = function (message, def) {
  return ask({ type: 'input', message, default: def })
}

function getHtml (url){
	var deferred = Q.defer();
	request(url, (error, response, body) => {
		if (!error && response.statusCode == 200) {
			deferred.resolve(cheerio.load(body));
		}else{
			deferred.reject(new Error(error))
		}
	});

	return deferred.promise;
}