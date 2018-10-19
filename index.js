const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const xhr = new XMLHttpRequest();
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');



var SqueezeboxAPI = (module.exports = function(opts) {
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
      this.token
        ? (fullRequest = this.uri + request + ";cauth=" + this.token)
        : (fullRequest = this.uri + request);

      xhr.open("GET", fullRequest);
      xhr.send(null);

      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 204) {
          getResponse ? resolve(xhr.responseText) : resolve(xhr.status);
        } else {
          reject("xhr.status");
        }
      };
      xhr.onerror = function(error) {
        reject("this is an error thrown by xhr: " + error);
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
    } else if(obj[key] === null) {
      // do nothing
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
        fs.writeFileSync('res.html', res, {encoding: 'utf-8'});

        const responseDOM = new JSDOM(res);
        const responseBody = responseDOM.window.document;

        let playerSelect = responseBody.querySelector("select")

        let playerNames = [];
        let playerMacs = [];

        // check if select dropdown for players is available
        if (playerSelect) {
          playerSelect.querySelectorAll("option").forEach(option => {
            playerMacs.push(option.value);
            playerNames.push(option.innerHTML);
          })
        } else {
          let h3Content = responseBody.querySelector('h3');
          playerNames.push(h3Content.textContent);

          let linkHref = decodeURIComponent(responseBody.querySelector("a").href);
          let macRegex = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g;
          linkHref.replace(macRegex, (match) => {
            playerMacs.push(match);
          })
        }

        let players = [];

        playerNames.map((elem, index) => {
          players.push({
            name: playerNames[index],
            mac: playerMacs[index]
          })
        });

        resolve(players);
      })
      .catch(err => reject(err))
  });
};

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

SqueezeboxAPI.prototype.setVolume = function(player, volume) {
  let requestBody = {
    p0: "mixer",
    p1: "volume",
    p2: volume,
    player: player ? player : null
  };
  let request = convertToQueryString(requestBody);

  return this.makeRequest(request, false);
};

SqueezeboxAPI.prototype.getVolume = function (player) {
  let requestBody = {
    p0: "status",
    player: player ? player : null
  };
  let request = convertToQueryString(requestBody);

  return new Promise((resolve, reject) => {
    this.makeRequest(request, true)
      .then(res => {
        fs.writeFileSync('res.html', res, {encoding: 'utf-8'});
        const responseDOM = new JSDOM(res);
        const responseBody = responseDOM.window.document;

        let aTags = responseBody.querySelectorAll("a");

        // make an array from all links containing volumes (unused ones)
        let unusedVolumes = [];
        aTags.forEach(a => {
          if (/volume/.test(a.href)) {
            if (!unusedVolumes.includes(parseInt(a.innerHTML))) {
              unusedVolumes.push(parseInt(a.innerHTML));
            }
          }
        })

        // get used volume by elminating all unused ones
        let usedVolume;
        for (let i = 1; i < unusedVolumes.length + 1; i++) {
          if (!unusedVolumes.includes(i)) {
            usedVolume = i;
          }
        }

        let response = {
          volume: usedVolume
        };

        resolve(response);
      })
      .catch(err => reject(err));
  });
};