/*
JSONProxy jQuery Plugin, v0.2.2
https://jsonp.nodejitsu.com

by Aidan Feldman
MIT license
*/
/*jshint browser:true */
/*global jQuery */
(function($){
  // groups: protocol, host, path
  var regex = /^(?:(?:(?:((?:file|https?):))?\/\/)?((?:[\w\-]\.?)+(?::\d+)?)?(\/\S*)?)$/i,
    PROXY = 'https://jsonp.nodejitsu.com/';


  var Url = function(str, paramStr){
    this.windowUrl = $.jsonp.getLocation();
    str = str || this.windowUrl.toString(); // jQuery.ajax() defaults to this
    this.href = str;
    this.paramStr = paramStr;
    this._parse();
  };

  Url.prototype._parse = function(){
    var match = this.href.match(regex); // not a valid URL unless matched
    this.protocol = match[1] || this.windowUrl.protocol;
    this.host = match[2] || this.windowUrl.host;
    this.path = match[3] || '';
  };

  // returns absolute URL
  Url.prototype.toString = function(){
    var urlStr = this.protocol + '//' + this.host + this.path;
    if (this.paramStr){
      // add params to URL being passed
      if (/\?/.test(this.path)){
        urlStr += '&';
      } else {
        // no existing query params
        if (!this.path) {
          urlStr += '/';
        }
        urlStr += '?';
      }
      urlStr += this.paramStr;
    }
    return urlStr;
  };

  Url.prototype.isInsecureRequest = function(){
    return this.windowUrl.protocol === 'https:' && this.protocol !== this.windowUrl.protocol;
  };


  // Accepts all jQuery.ajax() options, plus:
  //   corsSupport {Boolean} Set to true if the URL is known to support CORS for this domain.
  //   jsonpSupport {Boolean} Set to true if the URL is known to support JSONP.
  $.ajaxPrefilter('jsonproxy', function(opts){
    if (opts.crossDomain){
      var apiUrl = new Url(opts.url, opts.data),
        doProxy = false;

      // favor CORS because it can provide error messages from server to callbacks
      if ($.support.cors){
        // use the proxy if the endpoint doesn't support CORS, or if it would be an insecure request from a secure page
        if (!opts.corsSupport || apiUrl.isInsecureRequest()){
          // proxy CORS
          doProxy = true;
        } // else direct CORS
        opts.dataType = 'json';
      } else {
        if (!opts.jsonpSupport){
          // proxy JSONP
          doProxy = true;
        } // else direct JSONP

        opts.dataType = 'jsonp';
        opts.timeout = opts.timeout || 10000; // ensures error callbacks are fired
      }

      if (doProxy){
        opts.url = PROXY;
        opts.data = $.param({
          url: apiUrl.toString()
        });
      }
    } else {
      opts.dataType = 'json';
    }

    // weird workaround needed to have request handled properly
    // https://github.com/jquery/jquery/blob/995f70777ac6c0f988a44807ef1399e73937b2ee/src/ajax/jsonp.js#L55-L56
    opts.dataTypes[0] = opts.dataType;
    // delegate to the respective handler
    return opts.dataType;
  });

  $.jsonp = {
    // make this available for easier testing
    getLocation: function(){
      return window.location;
    }
  };
}(jQuery));
