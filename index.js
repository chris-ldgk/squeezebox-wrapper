const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const xhr = new XMLHttpRequest();

var SqueezeboxAPI = module.exports = function(opts) {
  var self = this;

  if (!opts) {
    throw new Error("Please specify options");
  }

  if (!opts.host) {
    throw new Error('Missing \'host\' option');
  }

  if (!opts.port) {
    throw new Error('Missing \'port\' option');
  }

  this.host = opts.host;
  this.port = opts.port;
  this.token = opts.token;
  this.uri = "http://" + opts.host + ":" + opts.port + '/status.html?';

  this.makeRequest = function(request) {
    request = encodeURIComponent(JSON.stringify({}))
    return new Promise((resolve, reject) => {
      xhr.open('GET', this.uri + request + ';cauth=' + opts.token);
      xhr.send(null);

      xhr.onload = function() {
        resolve(xhr.responseText);
      }
      xhr.onerror = function() {
        reject(xhr.responseText);
      }
    })
  }
}

function convertToQueryString(obj) {
  let queryString = "";
  for (key in obj) {
    queryString += encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]) + '&';
  }
  return queryString;
}

SqueezeboxAPI.prototype.play = function() {
  let requestBody = {
    p0: "playlist",
    p1: "play",
    p2: "songname"
  };
  let request = convertToQueryString(requestBody);
  console.log(request);
}
