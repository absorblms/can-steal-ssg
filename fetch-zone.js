"use strict";
var env = require("can-zone/lib/env");
var util = require("can-zone/lib/util");

module.exports = env.isNode ? nodeZone : browserZone;

var WAIT_URL = util.symbol("__canWaitURL");

function browserZone(data){
  var cache, oldFetch;
  var noop = Function.prototype;

  var matches = function(request, url, body) {
    var requestURL = request.url;
    // check if url is relative to server (i.e. /bar) instead of absolute url (i.e. http://foo/bar) so that done-ssr proxy-request will match on client-side
    if (url.substr(0, 1) === '/') {
      // strip everything before pathname to match url relative to server
      requestURL = requestURL.replace(/^\w*:\/{2}[^\/]+\//i, '/');
    }
    return (requestURL === url) &&
      (!body || request.data === body);
  };

  function stubFetch(url, options) {
    let response;

    for(var i = 0, len = cache.length; i < len; i++) {
      data = cache[i];
      if(matches(data.request, url, options.body)) {
        response = data.response;
        cache.splice(i, 1);
        break;
      }
    }

    const ensureReadable = (name, used) => {
      if(used) { 
        throw new Error(`Failed to execute '${name}' on 'Response': body stream already read`);
      }
    }

    if(response) {
      return Promise.resolve({
        arrayBuffer() {
          ensureReadable('arrayBuffer', this.bodyUsed);
          this.bodyUsed = true;
          return Promise.resolve(Uint16Array.of(...[...this._body].map(e => e.charCodeAt(0))).buffer)
        },
        json() {
          ensureReadable('json', this.bodyUsed);
          this.bodyUsed = true;
          return Promise.resolve(JSON.parse(this._body))
        },
        text() {
          ensureReadable('text', this.bodyUsed);
          this.bodyUsed = true;
          return Promise.resolve(this._body)
        },
        _body: response.responseText,
        get body() {
          this.bodyUsed = true;
          return new ReadableStream(this._body)
        },
        bodyUsed: false,
        ok: true,
        status: 200,
        statusText: "OK",
        url
      });
    } else {
      return oldFetch(url, options);
    }
  }


  return {
    beforeTask: function(){
      cache = env.global.FETCH_CACHE;
      if(cache) {
        oldFetch = fetch;
        global.fetch = stubFetch;
      }
    },

    afterTask: function(){
      if(oldFetch) {
        fetch = oldFetch;
        oldFetch = null;
      }
    }
  };
}

function nodeZone(data){
  var oldFetch;

  function stubFetch(url, options) {
    return oldFetch(url, options).then((response) => {
      const cloneResponse = response.clone();

      const headers = {};
      cloneResponse.headers.forEach(({ value, key }) => {
        headers[key] = value;
      })

      cloneResponse.text().then((respBody) => {
        if(!data.fetch) {
          data.fetch = new Fetch();
        }
        data.fetch.data.push({
          request: {
            url: url,
            data: options.body
          },
          response: {
            status: cloneResponse.status,
            responseText: respBody,
            headers: headers
          }
        });
      });

      return response;
    });
  }

  return {
    beforeTask: function(){
      oldFetch = fetch;
      global.fetch = stubFetch;
    },
    afterTask: function(){
      if(oldFetch) {
        global.fetch = oldFetch;
        oldFetch = null;
      }
    }
  };
}

var escapeTable = {
  "<": "\\u003c",
    ">": "\\u003e",
    "&": "\\u0026",
    "=": "\\u003d"
};

var escapeRegExp = new RegExp(
  "(" +
  Object.keys(escapeTable).join("|") +
  ")", "g");

function Fetch(){
  this.data = [];
}

Fetch.prototype.toString = function(){
  var json = JSON.stringify(this.data);
  json = json.replace(escapeRegExp, function(m){
    return escapeTable[m];
  });
  return "FETCH_CACHE = " + json + ";";
};
