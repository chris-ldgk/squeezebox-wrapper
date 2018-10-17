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
  this.uri = "http://" + opts.host + ":" + opts.port + "/status.html?";

  this.makeRequest = function(request, getResponse) {
    return new Promise((resolve, reject) => {
      let fullRequest = "";
      opts.token
        ? (fullRequest = this.uri + request + ";cauth=" + opts.token)
        : (fullRequest = this.uri + request);
      xhr.open("GET", fullRequest);
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
  let queryArr = [];

  // Convert object to array
  Object.keys(obj).map(key => {
    queryArr.push([key, obj[key]]);
  });

  for (elem in queryArr) {
    if (queryArr.indexOf(queryArr[elem]) === queryArr.length - 1) {
      queryString += queryArr[elem][0] + '=' + queryArr[elem][1];
    } else {
      queryString += queryArr[elem][0] + '=' + queryArr[elem][1] + '&';
    }
  }
  return queryString;
}

SqueezeboxAPI.prototype.play = function() {
  let requestBody = {
    p0: "play"
  };
  let request = convertToQueryString(requestBody);
  console.log(request);
}

