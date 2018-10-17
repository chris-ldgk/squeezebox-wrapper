const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  xhr = new XMLHttpRequest();
  DomParser = require('dom-parser');
  parser = new DomParser();

var SqueezeboxAPI = (module.exports = function(opts) {
  var self = this;

  if (!opts) {
    throw new Error("Please specify options");
  }

  if (!opts.host) {
    throw new Error("Missing 'host' option");
  }

  if (!opts.port) {
    throw new Error("Missing 'port' option");
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
        if (xhr.status === 200 || xhr.status === 204) {
          getResponse
            ? resolve(xhr.responseText)
            : resolve(xhr.status)
          
        } else {
          reject(xhr.status);
        }
      };
      xhr.onerror = function() {
        reject(xhr.status);
      };
    });
  };
});

function convertToQueryString(obj) {
  let queryString = "";
  let queryArr = [];

  // Convert request object to array
  Object.keys(obj).map(key => {
    if (Array.isArray(obj[key])) {
      obj.player.map(arrObj => {
        queryArr.push([key, arrObj]);
      });
    } else {
      queryArr.push([key, obj[key]]);
    }
  });

  // Convert request Array to Querystring
  for (elem in queryArr) {
    if (queryArr.indexOf(queryArr[elem]) === queryArr.length - 1) {
      queryString += queryArr[elem][0] + "=" + queryArr[elem][1];
    } else {
      queryString += queryArr[elem][0] + "=" + queryArr[elem][1] + "&";
    }
  }

  return queryString;
}

SqueezeboxAPI.prototype.getPlayers = function() {
  return new Promise((resolve, reject) => {
    this.makeRequest(null, true)
      .then(res => {
        // Convert Response String to DOM
        let responseDOM = parser.parseFromString(res, "application/xml");
        let playerHTML = responseDOM.getElementsByName("player")[0].innerHTML;

        // Get players from DOM
        let players = [];
        playerHTML.replace(/value=\"(.+?)\"/g, (match) => {
          match = match.replace("value=\"", "").replace("\"", "");
          players.push(match);
        });

        // return players to function
        resolve(players);
      })
      .catch(err => reject(err));
  })
}

SqueezeboxAPI.prototype.play = function(player) {
  let requestBody = {
    p0: "play",
    player: player ? player : null
  };
  let request = convertToQueryString(requestBody);

  return this.makeRequest(request, false);
};

SqueezeboxAPI.prototype.pause = function(player) {
  let requestBody = {
    p0: "pause",
    player: player ? player : null
  };
  let request = convertToQueryString(requestBody);

  return this.makeRequest(request, false);
};
