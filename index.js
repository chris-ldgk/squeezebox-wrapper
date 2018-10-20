const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const xhr = new XMLHttpRequest();
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const axios = require("axios");

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

      axios
        .get(fullRequest)
        .then(res => {
          if (res.status === 200 || res.status === 204) {
            getResponse ? resolve(res.data) : resolve(res.status);
          }
        })
        .catch(err => console.log(err));
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
    } else if (obj[key] === null) {
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
        const responseDOM = new JSDOM(res);
        const responseBody = responseDOM.window.document;

        let playerSelect = responseBody.querySelector("select");

        let playerNames = [];
        let playerMacs = [];

        // check if select dropdown for players is available
        if (playerSelect) {
          playerSelect.querySelectorAll("option").forEach(option => {
            playerMacs.push(option.value);
            playerNames.push(option.innerHTML);
          });
        } else {
          let h3Content = responseBody.querySelector("h3");
          playerNames.push(h3Content.textContent);

          let linkHref = decodeURIComponent(
            responseBody.querySelector("a").href
          );
          let macRegex = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g;
          linkHref.replace(macRegex, match => {
            playerMacs.push(match);
          });
        }

        let players = [];

        playerNames.map((elem, index) => {
          players.push({
            name: playerNames[index],
            mac: playerMacs[index]
          });
        });

        resolve(players);
      })
      .catch(err => reject(err));
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

SqueezeboxAPI.prototype.skip = function(player) {
  let requestBody = {
    p0: "playlist",
    p1: "jump",
    p2: "+1",
    player: player ? player : null
  };
  let request = convertToQueryString(requestBody);

  return this.makeRequest(request, false);
};

SqueezeboxAPI.prototype.rewind = function(player) {
  let requestBody = {
    p0: "playlist",
    p1: "jump",
    p2: "-1",
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

SqueezeboxAPI.prototype.getVolume = function(player) {
  let requestBody = {
    p0: "status",
    player: player ? player : null
  };
  let request = convertToQueryString(requestBody);

  return new Promise((resolve, reject) => {
    this.makeRequest(request, true)
      .then(res => {
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
        });

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

SqueezeboxAPI.prototype.getPlaying = function(player) {
  let requestBody = { p0: "status", player: player ? player : null };
  let request = convertToQueryString(requestBody);

  return new Promise((resolve, reject) => {
    this.makeRequest(request, true)
      .then(res => {
        const responseDOM = new JSDOM(res);
        const responseBody = responseDOM.window.document;

        const bTags = responseBody.querySelectorAll("b");
        let bContents = [];
        bTags.forEach(tag => {
          bContents.push(tag.innerHTML);
        });

        let isPlaying;
        if (bContents.includes("Wiedergabe")) {
          isPlaying = true;
        } else {
          isPlaying = false;
        }

        let response = {
          playing: isPlaying
        };

        resolve(response);
      })
      .catch(err => reject(err));
  });
};

SqueezeboxAPI.prototype.getPlaylist = function(player) {
  let requestBody = { p0: "status", player: player ? player : null };
  let request = convertToQueryString(requestBody);

  return new Promise((resolve, reject) => {
    this.makeRequest(request, true)
      .then(res => {
        fs.writeFileSync("res.html", res, { encoding: "utf-8" });

        const responseDOM = new JSDOM(res);
        const responseBody = responseDOM.window.document;

        let songDetails = responseBody.getElementsByClassName(
          "playlistSongDetail"
        );

        let songDetailsArr = [];
        Object.keys(songDetails).map(key => {
          let elem = songDetails[key];
          let innerHTML = elem.innerHTML;
          let HTMLTagRegex = new RegExp("<[^>]*>", "g");
          if (HTMLTagRegex.test(innerHTML)) {
            songDetailsArr.push(
              innerHTML.replace(HTMLTagRegex, "").replace(/(\n|\t)/g, "")
            );
          } else {
            songDetailsArr.push(innerHTML.replace(/(\n|\t)/g, ""));
          }
        });

        let response = [];

        let songNames = [];
        let albumNames = [];
        let artistNames = [];
        for (let i = 0; i < songDetailsArr.length / 3; i++) {
          if ((i + 1) % 2 === 0) {
            artistNames.push(songDetailsArr[i]);
          } else if ((i + 1) % 3 === 0) {
            albumNames.push(songDetailsArr[i]);
          } else {
            songNames.push(songDetailsArr[i]);
          }
        }

        songNames.map((elem, index) => {
          response.push({
            songName: songNames[index] ? songNames[index] : "",
            artistName: artistNames[index] ? artistNames[index] : "",
            albumName: albumNames[index] ? albumNames[index] : ""
          });
        });

        resolve(response);
      })
      .catch(err => reject(err));
  });
};

SqueezeboxAPI.prototype.getCurrentSong = function(player) {
  console.log(0);
  return new Promise((resolve, reject) => {
    this.makeRequest(null, true)
      .then(res => {
        const responseDOM = new JSDOM(res);
        const responseBody = responseDOM.window.document;

        let songInfoLink;

        Object.keys((links = responseBody.querySelectorAll("a"))).map(key => {
          let elem = links[key];
          if (/songinfo/.test(elem.href)) {
            songInfoLink = elem.href;
          }
        });
        console.log(1);

        axios("http://" + this.host + ":" + this.port + songInfoLink)
          .then(res => {
            console.log(2);
            const resDOM = new JSDOM(res.data);
            const resBody = resDOM.window.document;

            let artistName = resBody.getElementById("ARTIST").children[1]
              .textContent;
            let albumName = resBody.getElementById("ALBUM").children[1]
              .textContent;
            let songName = "";
            console.log(4);

            Object.keys(
              (elements = resBody.getElementsByClassName("browsedbListItem"))
            ).map(key => {
              let elem = elements[key];
              if (/Titel:/.test(elem.textContent)) {
                songName = elem.textContent
                  .replace("Titel:", "")
                  .replace(/^\s+|\s+$/g, "");
              }
            });

            console.log(5);
            
            let response = {
              currentSong: {
                songName: songName,
                artistName: artistName,
                albumName: albumName
              }
            };

            console.log(response);

            resolve(response);
          })
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
};
