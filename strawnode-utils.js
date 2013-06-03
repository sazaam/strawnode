

'use strict' ;

(function(name, definition){
	
	if ('function' === typeof define){ // AMD
		define(definition) ;
	} else if ('undefined' !== typeof module && module.exports) { // Node.js
		module.exports = ('function' === typeof definition) ? definition() : definition ;
	} else {
		if(definition !== undefined) this[name] = ('function' === typeof definition) ? definition() : definition ;
	}

})('strawnode-utils', Pkg.write('org.libspark.straw', function(){

	Object.keys = Object.keys || (function () {
		var hasOwnProperty = Object.prototype.hasOwnProperty,
			hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
			DontEnums = [
				'toString',
				'toLocaleString',
				'valueOf',
				'hasOwnProperty',
				'isPrototypeOf',
				'propertyIsEnumerable',
				'constructor'
			],
			DontEnumsLength = DontEnums.length;
	  
		return function (o) {
			if (!Type.of(o , "object") && !Type.of(o, "function") || o === null)
				throw new TypeError("Object.keys called on a non-object");
		 
			var result = [];
			for (var name in o) {
				if (hasOwnProperty.call(o, name))
					result.push(name);
			}
		 
			if (hasDontEnumBug) {
				for (var i = 0; i < DontEnumsLength; i++) {
					if (hasOwnProperty.call(o, DontEnums[i]))
						result.push(DontEnums[i]);
				}  
			}
		 
			return result;
		} ;
	})() ;
	
	var OS = Type.define(function(){
		return {
			pkg:'sys::OS',
			domain:Type.appdomain,
			statics:{
				type:function type(){return 'Windows'}
			},
			constructor:OS = function OS(){}
		} ;
	}) ;
	
	var Url = Type.define(function(){
		var protocolPattern = /^([a-z0-9.+-]+:)/i,
		portPattern = /:[0-9]*$/,

		// RFC 2396: characters reserved for delimiting URLs.
		// We actually just auto-escape these.
		delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

		// RFC 2396: characters not allowed for various reasons.
		unwise = ['{', '}', '|', '\\', '^', '~', '`'].concat(delims),

		// Allowed by RFCs, but cause of XSS attacks. Always escape these.
		autoEscape = ['\''].concat(delims),
		// Characters that are never ever allowed in a hostname.
		// Note that any invalid chars are also handled, but these
		// are the ones that are *expected* to be seen, so we fast-path
		// them.
		nonHostChars = ['%', '/', '?', ';', '#']
		.concat(unwise).concat(autoEscape),
		nonAuthChars = ['/', '@', '?', '#'].concat(delims),
		hostnameMaxLen = 255,
		hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,
		hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,
		// protocols that can allow "unsafe" and "unwise" chars.
		unsafeProtocol = {
		'javascript': true,
		'javascript:': true
		},
		// protocols that never have a hostname.
		hostlessProtocol = {
		'javascript': true,
		'javascript:': true
		},
		// protocols that always have a path component.
		pathedProtocol = {
		'http': true,
		'https': true,
		'ftp': true,
		'gopher': true,
		'file': true,
		'http:': true,
		'ftp:': true,
		'gopher:': true,
		'file:': true
		},
		// protocols that always contain a // bit.
		slashedProtocol = {
		'http': true,
		'https': true,
		'ftp': true,
		'gopher': true,
		'file': true,
		'http:': true,
		'https:': true,
		'ftp:': true,
		'gopher:': true,
		'file:': true
		};
		return {
			pkg:'net::Url',
			domain:Type.appdomain,
			statics:{
				parse:function parse(url, parseQueryString, slashesDenoteHost){
					if (url && Type.of(url, 'object') && Type.is(url, Url)) return url ;
					var u = new Url() ;
					u.parse(url, parseQueryString, slashesDenoteHost) ;
					return u ;
				},
				format:function format(obj){
					if (Type.of(obj, 'string')) obj = Url.parse(obj);
					if (!Type.is(obj, Url)) return Url.factory.format.call(obj);
					return obj.format();
				},
				resolve:function resolve(from, to){
					return Url.parse(from, false, true).resolve(to);
				}
			},
			constructor:function Url(){
				this.protocol = null;
				this.slashes = null;
				this.auth = null;
				this.host = null;
				this.port = null;
				this.hostname = null;
				this.hash = null;
				this.search = null;
				this.query = null;
				this.pathname = null;
				this.path = null;
			},
			resolve:function resolve(relative) {
				return this.resolveObject(Url.parse(relative, false, true)).format();
			},
			resolveObject:function resolveObject(relative) {
				if (Type.of(relative, 'string')) {
					var rel = new Url();
					rel.parse(relative, false, true);
					relative = rel;
				}

				var result = new Url();
				Object.keys(this).forEach(function(k) {
					result[k] = this[k];
				}, this);

				// hash is always overridden, no matter what.
				// even href="" will remove it.
				result.hash = relative.hash;

				// if the relative url is empty, then there's nothing left to do here.
				if (relative.href === '') {
					result.href = result.format();
					return result;
				}

				// hrefs like //foo/bar always cut to the protocol.
				if (relative.slashes && !relative.protocol) {
					// take everything except the protocol from relative
					Object.keys(relative).forEach(function(k) {
						if (k !== 'protocol')
						result[k] = relative[k];
					});

					//urlParse appends trailing / to urls like http://www.example.com
					if (slashedProtocol[result.protocol] &&
						result.hostname && !result.pathname) {
						result.path = result.pathname = '/';
					}

					result.href = result.format();
					return result;
				}

				if (relative.protocol && relative.protocol !== result.protocol) {
					// if it's a known url protocol, then changing
					// the protocol does weird things
					// first, if it's not file:, then we MUST have a host,
					// and if there was a path
					// to begin with, then we MUST have a path.
					// if it is file:, then the host is dropped,
					// because that's known to be hostless.
					// anything else is assumed to be absolute.
					if (!slashedProtocol[relative.protocol]) {
						Object.keys(relative).forEach(function(k) {
							result[k] = relative[k];
						});
						result.href = result.format();
						return result;
					}

					result.protocol = relative.protocol;
						if (!relative.host && !hostlessProtocol[relative.protocol]) {
						var relPath = (relative.pathname || '').split('/');
						while (relPath.length && !(relative.host = relPath.shift()));
						if (!relative.host) relative.host = '';
						if (!relative.hostname) relative.hostname = '';
						if (relPath[0] !== '') relPath.unshift('');
						if (relPath.length < 2) relPath.unshift('');
						result.pathname = relPath.join('/');
					} else {
						result.pathname = relative.pathname;
					}
					result.search = relative.search;
					result.query = relative.query;
					result.host = relative.host || '';
					result.auth = relative.auth;
					result.hostname = relative.hostname || relative.host;
					result.port = relative.port;
					// to support http.request
					if (result.pathname || result.search) {
						var p = result.pathname || '';
						var s = result.search || '';
						result.path = p + s;
					}
					result.slashes = result.slashes || relative.slashes;
					result.href = result.format();
					return result;
				}

				var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
					isRelAbs = (
					relative.host ||
					relative.pathname && relative.pathname.charAt(0) === '/'
					),
					mustEndAbs = (isRelAbs || isSourceAbs ||
					(result.host && relative.pathname)),
					removeAllDots = mustEndAbs,
					srcPath = result.pathname && result.pathname.split('/') || [],
					relPath = relative.pathname && relative.pathname.split('/') || [],
					psychotic = result.protocol && !slashedProtocol[result.protocol];

				// if the url is a non-slashed url, then relative
				// links like ../.. should be able
				// to crawl up to the hostname, as well.  This is strange.
				// result.protocol has already been set by now.
				// Later on, put the first path part into the host field.
				if (psychotic) {
					result.hostname = '';
					result.port = null;
					if (result.host) {
						if (srcPath[0] === '') srcPath[0] = result.host;
						else srcPath.unshift(result.host);
					}
					result.host = '';
					if (relative.protocol) {
						relative.hostname = null;
						relative.port = null;
						if (relative.host) {
							if (relPath[0] === '') relPath[0] = relative.host;
							else relPath.unshift(relative.host);
						}
						relative.host = null;
					}
					mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
				}

				if (isRelAbs) {
					// it's absolute.
					result.host = (relative.host || relative.host === '') ?
					relative.host : result.host;
					result.hostname = (relative.hostname || relative.hostname === '') ?
					relative.hostname : result.hostname;
					result.search = relative.search;
					result.query = relative.query;
					srcPath = relPath;
					// fall through to the dot-handling below.
				} else if (relPath.length) {
					// it's relative
					// throw away the existing file, and take the new path instead.
					if (!srcPath) srcPath = [];
					srcPath.pop();
					srcPath = srcPath.concat(relPath);
					result.search = relative.search;
					result.query = relative.query;
				} else if (relative.search !== null && relative.search !== undefined) {
					// just pull out the search.
					// like href='?foo'.
					// Put this after the other two cases because it simplifies the booleans
					if (psychotic) {
					result.hostname = result.host = srcPath.shift();
					//occationaly the auth can get stuck only in host
					//this especialy happens in cases like
					//url.resolveObject('mailto:local1@domain1', 'local2@domain2')
					var authInHost = result.host && result.host.indexOf('@') > 0 ?
					result.host.split('@') : false;
					if (authInHost) {
					result.auth = authInHost.shift();
					result.host = result.hostname = authInHost.shift();
					}
					}
					result.search = relative.search;
					result.query = relative.query;
					//to support http.request
					if (result.pathname !== null || result.search !== null) {
					result.path = (result.pathname ? result.pathname : '') +
					(result.search ? result.search : '');
					}
					result.href = result.format();
					return result;
				}

				if (!srcPath.length) {
					// no path at all.  easy.
					// we've already handled the other stuff above.
					result.pathname = null;
					//to support http.request
					if (result.search) {
					result.path = '/' + result.search;
					} else {
					result.path = null;
					}
					result.href = result.format();
					return result;
				}

				// if a url ENDs in . or .., then it must get a trailing slash.
				// however, if it ends in anything else non-slashy,
				// then it must NOT get a trailing slash.
				var last = srcPath.slice(-1)[0];
				var hasTrailingSlash = (
					(result.host || relative.host) && (last === '.' || last === '..') ||
						last === '');

				// strip single dots, resolve double dots to parent dir
				// if the path tries to go above the root, `up` ends up > 0
				var up = 0;
				for (var i = srcPath.length; i >= 0; i--) {
					last = srcPath[i];
					if (last == '.') {
						srcPath.splice(i, 1);
					} else if (last === '..') {
						srcPath.splice(i, 1);
						up++;
					} else if (up) {
						srcPath.splice(i, 1);
						up--;
					}
				}

				// if the path is allowed to go above the root, restore leading ..s
				if (!mustEndAbs && !removeAllDots) {
					for (; up--; up) {
						srcPath.unshift('..');
					}
				}

				if (mustEndAbs && srcPath[0] !== '' &&
					(!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
					srcPath.unshift('');
				}

				if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
					srcPath.push('');
				}

				var isAbsolute = srcPath[0] === '' ||
					(srcPath[0] && srcPath[0].charAt(0) === '/');

				// put the host back
				if (psychotic) {
					result.hostname = result.host = isAbsolute ? '' :
						srcPath.length ? srcPath.shift() : '';
					//occationaly the auth can get stuck only in host
					//this especialy happens in cases like
					//url.resolveObject('mailto:local1@domain1', 'local2@domain2')
					var authInHost = result.host && result.host.indexOf('@') > 0 ?
					result.host.split('@') : false;
					if (authInHost) {
					result.auth = authInHost.shift();
					result.host = result.hostname = authInHost.shift();
					}
				}

				mustEndAbs = mustEndAbs || (result.host && srcPath.length);

				if (mustEndAbs && !isAbsolute) {
					srcPath.unshift('');
				}

				if (!srcPath.length) {
					result.pathname = null;
					result.path = null;
				} else {
					result.pathname = srcPath.join('/');
				}

				//to support request.http
				if (result.pathname !== null || result.search !== null) {
					result.path = (result.pathname ? result.pathname : '') +
						(result.search ? result.search : '');
				}
				result.auth = relative.auth || result.auth;
				result.slashes = result.slashes || relative.slashes;
				result.href = result.format();
				return result;
			},
			format:function format() {
				
				var auth = this.auth || '';
				if (auth) {
				auth = encodeURIComponent(auth);
				auth = auth.replace(/%3A/i, ':');
				auth += '@';
				}

				var protocol = this.protocol || '',
				pathname = this.pathname || '',
				hash = this.hash || '',
				host = false,
				query = '';

				if (this.host) {
				host = auth + this.host;
				} else if (this.hostname) {
				host = auth + (this.hostname.indexOf(':') === -1 ?
				this.hostname :
				'[' + this.hostname + ']');
				if (this.port) {
				host += ':' + this.port;
				}
				}

				if (this.query && Type.of(this.query, 'object') &&
				Object.keys(this.query).length) {
				query = querystring.stringify(this.query);
				}

				var search = this.search || (query && ('?' + query)) || '';

				if (protocol && protocol.substr(-1) !== ':') protocol += ':';

				// only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
				// unless they had them to begin with.
				if (this.slashes ||
				(!protocol || slashedProtocol[protocol]) && host !== false) {
				host = '//' + (host || '');
				if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
				} else if (!host) {
				host = '';
				}

				if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
				if (search && search.charAt(0) !== '?') search = '?' + search;

				return protocol + host + pathname + search + hash;

			},
			parseHost:function parseHost() {
				var host = this.host;
				var port = portPattern.exec(host);
				if (port) {
					port = port[0];
					if (port !== ':') {
						this.port = port.substr(1);
					}
					host = host.substr(0, host.length - port.length);
				}
				if (host) this.hostname = host;
			},
			parse:function(url, parseQueryString, slashesDenoteHost){
				if (!Type.of(url, 'string')) {
					throw new TypeError("Parameter 'url' must be a string, not " + Type.of(url)) ;
				}
				
				var rest = url;

				// trim before proceeding.
				// This is to support parse stuff like " http://foo.com \n"
				rest = rest.trim();

				var proto = protocolPattern.exec(rest);
				if (proto) {
					proto = proto[0];
					var lowerProto = proto.toLowerCase();
					this.protocol = lowerProto;
					rest = rest.substr(proto.length);
				}

				// figure out if it's got a host
				// user@server is *always* interpreted as a hostname, and url
				// resolution will treat //foo/bar as host=foo,path=bar because that's
				// how the browser resolves relative URLs.
				if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
					var slashes = rest.substr(0, 2) === '//';
					if (slashes && !(proto && hostlessProtocol[proto])) {
						rest = rest.substr(2);
						this.slashes = true;
					}
				}

				if (!hostlessProtocol[proto] &&
					(slashes || (proto && !slashedProtocol[proto]))) {
					// there's a hostname.
					// the first instance of /, ?, ;, or # ends the host.
					// don't enforce full RFC correctness, just be unstupid about it.

					// If there is an @ in the hostname, then non-host chars *are* allowed
					// to the left of the first @ sign, unless some non-auth character
					// comes *before* the @-sign.
					// URLs are obnoxious.
					var atSign = rest.indexOf('@');
					if (atSign !== -1) {
						var auth = rest.slice(0, atSign);

						// there *may be* an auth
						var hasAuth = true;
						for (var i = 0, l = nonAuthChars.length; i < l; i++) {
							if (auth.indexOf(nonAuthChars[i]) !== -1) {
							// not a valid auth. Something like http://foo.com/bar@baz/
							hasAuth = false;
							break;
							}
						}

						if (hasAuth) {
							// pluck off the auth portion.
							this.auth = decodeURIComponent(auth);
							rest = rest.substr(atSign + 1);
						}
					}

					var firstNonHost = -1;
					for (var i = 0, l = nonHostChars.length; i < l; i++) {
						var index = rest.indexOf(nonHostChars[i]);
						if (index !== -1 &&
							(firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
					}

					if (firstNonHost !== -1) {
						this.host = rest.substr(0, firstNonHost);
						rest = rest.substr(firstNonHost);
					} else {
						this.host = rest;
						rest = '';
					}

					// pull out port.
					this.parseHost();

					// we've indicated that there is a hostname,
					// so even if it's empty, it has to be present.
					this.hostname = this.hostname || '';

					// if hostname begins with [ and ends with ]
					// assume that it's an IPv6 address.
					var ipv6Hostname = this.hostname[0] === '[' &&
						this.hostname[this.hostname.length - 1] === ']';

					// validate a little.
					if (!ipv6Hostname) {
						var hostparts = this.hostname.split(/\./);
						for (var i = 0, l = hostparts.length; i < l; i++) {
							var part = hostparts[i];
							if (!part) continue;
							if (!part.match(hostnamePartPattern)) {
								var newpart = '';
								for (var j = 0, k = part.length; j < k; j++) {
									if (part.charCodeAt(j) > 127) {
										// we replace non-ASCII char with a temporary placeholder
										// we need this to make sure size of hostname is not
										// broken by replacing non-ASCII by nothing
										newpart += 'x';
									} else {
										newpart += part[j];
									}
								}
								// we test again with ASCII char only
								if (!newpart.match(hostnamePartPattern)) {
									var validParts = hostparts.slice(0, i);
									var notHost = hostparts.slice(i + 1);
									var bit = part.match(hostnamePartStart);
									if (bit) {
										validParts.push(bit[1]);
										notHost.unshift(bit[2]);
									}
									if (notHost.length) {
										rest = '/' + notHost.join('.') + rest;
									}
									this.hostname = validParts.join('.');
									break;
								}
							}
						}
					}

					if (this.hostname.length > hostnameMaxLen) {
						this.hostname = '';
					} else {
						// hostnames are always lower case.
						this.hostname = this.hostname.toLowerCase();
					}

					if (!ipv6Hostname) {
						// IDNA Support: Returns a puny coded representation of "domain".
						// It only converts the part of the domain name that
						// has non ASCII characters. I.e. it dosent matter if
						// you call it with a domain that already is in ASCII.
						var domainArray = this.hostname.split('.');
						var newOut = [];
						for (var i = 0; i < domainArray.length; ++i) {
							var s = domainArray[i];
							newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
								'xn--' + punycode.encode(s) : s);
						}
						this.hostname = newOut.join('.');
					}

					var p = this.port ? ':' + this.port : '';
					var h = this.hostname || '';
					this.host = h + p;
					this.href += this.host;

					// strip [ and ] from the hostname
					// the host field still retains them, though
					if (ipv6Hostname) {
						this.hostname = this.hostname.substr(1, this.hostname.length - 2);
						if (rest[0] !== '/') {
							rest = '/' + rest;
						}
					}
				}

				// now rest is set to the post-host stuff.
				// chop off any delim chars.
				if (!unsafeProtocol[lowerProto]) {

					// First, make 100% sure that any "autoEscape" chars get
					// escaped, even if encodeURIComponent doesn't think they
					// need to be.
					for (var i = 0, l = autoEscape.length; i < l; i++) {
						var ae = autoEscape[i];
						var esc = encodeURIComponent(ae);
						if (esc === ae) {
							esc = escape(ae);
						}
						rest = rest.split(ae).join(esc);
					}
				}


					// chop off from the tail first.
				var hash = rest.indexOf('#');
				if (hash !== -1) {
					// got a fragment string.
					this.hash = rest.substr(hash);
					rest = rest.slice(0, hash);
				}
				var qm = rest.indexOf('?');
				if (qm !== -1) {
					this.search = rest.substr(qm);
					this.query = rest.substr(qm + 1);
					if (parseQueryString) {
						this.query = querystring.parse(this.query);
					}
					rest = rest.slice(0, qm);
				} else if (parseQueryString) {
					// no query string, but parseQueryString still requested
					this.search = '';
					this.query = {};
				}
				if (rest) this.pathname = rest;
				if (slashedProtocol[proto] &&
					this.hostname && !this.pathname) {
					this.pathname = '/';
				}

				//to support http.request
				if (this.pathname || this.search) {
					var p = this.pathname || '';
					var s = this.search || '';
					this.path = p + s;
				}

				// finally, reconstruct the href based on what has been validated.
				this.href = this.format();
				return this;
			}
		}
	}) ;
	
	var Path = Type.define(function(){
		return {
			pkg:'net::Path',
			domain:Type.appdomain,
			statics:{
				sep : '\\',
				delimiter : ';',
				resolve : function resolve() {
					var resolvedDevice = '',
					resolvedTail = '',
					resolvedAbsolute = false ;

					for (var i = arguments.length - 1; i >= -1; i--) {
						var path ;
						if (i >= 0) {
							path = arguments[i] ;
						} else if (!resolvedDevice) {
							path = process.cwd() ;
						} else {
							// Windows has the concept of drive-specific current working
							// directories. If we've resolved a drive letter but not yet an
							// absolute path, get cwd for that drive. We're sure the device is not
							// an unc path at this points, because unc paths are always absolute.
							path = process.env['=' + resolvedDevice] ;
							// Verify that a drive-local cwd was found and that it actually points
							// to our drive. If not, default to the drive's root.
							if (!path || path.substr(0, 3).toLowerCase() !== resolvedDevice.toLowerCase() + '\\') {
								path = resolvedDevice + '\\' ;
							}
						}

						// Skip empty and invalid entries
						if (!Type.of(path, 'string')) {
							throw new TypeError('Arguments to path.resolve must be strings') ;
						} else if (!path) {
							continue;
						}

						var result = splitDeviceRe.exec(path),
						device = result[1] || '',
						isUnc = device && device.charAt(1) !== ':',
						isAbsolute = !!result[2] || isUnc, // UNC paths are always absolute
						tail = result[3] ;

						if (device && resolvedDevice && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
							// This path points to another device so it is not applicable
							continue ;
						}

						if (!resolvedDevice) {
							resolvedDevice = device ;
						}
						if (!resolvedAbsolute) {
							resolvedTail = tail + '\\' + resolvedTail ;
							resolvedAbsolute = isAbsolute ;
						}

						if (resolvedDevice && resolvedAbsolute) {
							break ;
						}
					}

					// Convert slashes to backslashes when `resolvedDevice` points to an UNC
					// root. Also squash multiple slashes into a single one where appropriate.
					if (isUnc) {
						resolvedDevice = normalizeUNCRoot(resolvedDevice);
					}

					// At this point the path should be resolved to a full absolute path,
					// but handle relative paths to be safe (might happen when process.cwd()
					// fails)

					// Normalize the tail path

					function f(p) {
						return !!p ;
					}

					resolvedTail = normalizeArray(resolvedTail.split(/[\\\/]+/).filter(f), !resolvedAbsolute).join('\\') ;

					return (resolvedDevice + (resolvedAbsolute ? '\\' : '') + resolvedTail) || '.' ;
				},
				normalize : function normalize(path) {
					var result = splitDeviceRe.exec(path),
					device = result[1] || '',
					isUnc = device && device.charAt(1) !== ':',
					isAbsolute = !!result[2] || isUnc, // UNC paths are always absolute
					tail = result[3],
					trailingSlash = /[\\\/]$/.test(tail) ;

					// Normalize the tail path
					tail = normalizeArray(tail.split(/[\\\/]+/).filter(function(p) {
						return !!p ;
					}), !isAbsolute).join('\\') ;

					if (!tail && !isAbsolute) {
						tail = '.' ;
					}
					if (tail && trailingSlash) {
						tail += '\\' ;
					}

					// Convert slashes to backslashes when `device` points to an UNC root.
					// Also squash multiple slashes into a single one where appropriate.
					if (isUnc) {
						device = normalizeUNCRoot(device);
					}

					return device + (isAbsolute ? '\\' : '') + tail ;
				},
				join : function join() {
					function f(p) {
						if (!Type.of(p, 'string')) {
						throw new TypeError('Arguments to path.join must be strings') ;
						}
						return p ;
					}

					var paths = Array.prototype.filter.call(arguments, f) ;
					var joined = paths.join('\\') ;

					// Make sure that the joined path doesn't start with two slashes, because
					// normalize() will mistake it for an UNC path then.
					//
					// This step is skipped when it is very clear that the user actually
					// intended to point at an UNC path. This is assumed when the first
					// non-empty string arguments starts with exactly two slashes followed by
					// at least one more non-slash character.
					//
					// Note that for normalize() to treat a path as an UNC path it needs to
					// have at least 2 components, so we don't filter for that here.
					// This means that the user can use join to construct UNC paths from
					// a server name and a share name; for example:
					//   path.join('//server', 'share') -> '\\\\server\\share\')
					if (!/^[\\\/]{2}[^\\\/]/.test(paths[0])) {
						joined = joined.replace(/^[\\\/]{2,}/, '\\') ;
					}

					return exports.normalize(joined) ;
				},
				relative : function relative(from, to) {
					from = exports.resolve(from) ;
					to = exports.resolve(to) ;

					// windows is not case sensitive
					var lowerFrom = from.toLowerCase() ;
					var lowerTo = to.toLowerCase() ;

					function trim(arr) {
						var start = 0 ;
						for (; start < arr.length ; start++) {
							if (arr[start] !== '') break ;
						}

						var end = arr.length - 1 ;
						for (; end >= 0; end--) {
							if (arr[end] !== '') break ;
						}

						if (start > end) return [] ;
						
						return arr.slice(start, end - start + 1) ;
					}

					var toParts = trim(to.split('\\')) ;

					var lowerFromParts = trim(lowerFrom.split('\\')) ;
					var lowerToParts = trim(lowerTo.split('\\')) ;

					var length = Math.min(lowerFromParts.length, lowerToParts.length) ;
					var samePartsLength = length ;
					for (var i = 0; i < length; i++) {
						if (lowerFromParts[i] !== lowerToParts[i]) {
							samePartsLength = i ;
							break ;
						}
					}

					if (samePartsLength == 0) {
						return to;
					}

					var outputParts = [];
					for (var i = samePartsLength; i < lowerFromParts.length; i++) {
						outputParts.push('..') ;
					}

					outputParts = outputParts.concat(toParts.slice(samePartsLength)) ;

					return outputParts.join('\\') ;
				},
				dirname : function dirname(path) {
					var result = splitPath(path),
					root = result[0],
					dir = result[1] ;

					if (!root && !dir) {
						// No dirname whatsoever
						return '.';
					}

					if (dir) {
						// It has a dirname, strip trailing slash
						dir = dir.substr(0, dir.length - 1) ;
					}

					return root + dir ;
				},
				basename : function basename(path, ext) {
					var f = splitPath(path)[2] ;
					// TODO: make this comparison case-insensitive on windows?
					if (ext && f.substr(-1 * ext.length) === ext) {
						f = f.substr(0, f.length - ext.length) ;
					}
					return f ;
				},
				extname : function extname(path) {
					return splitPath(path)[3] ;
				},
				exists : function exists() { // deprecated
					if (!warned) {
						if (process.throwDeprecation) {
							throw new Error(msg) ;
						} else if (process.traceDeprecation) {
							console.trace(msg) ;
						} else {
							console.error(msg) ;
						}
						warned = true ;
					}
					return fn.apply(this, arguments) ;
				},
				existsSync:function existsSync() {// deprecated
					if (!warned) {
						if (process.throwDeprecation) {
							throw new Error(msg) ;
						} else if (process.traceDeprecation) {
							console.trace(msg) ;
						} else {
							console.error(msg) ;
						}
						warned = true ;
					}
					return fn.apply(this, arguments) ;
				},
				_makeLong : function _makeLong(path) {
					// Note: this will *probably* throw somewhere.
					if (!Type.of(path, 'string'))
						return path ;

					if (!path) {
						return '' ;
					}

					var resolvedPath = exports.resolve(path) ;

					if (/^[a-zA-Z]\:\\/.test(resolvedPath)) {
						// path is local filesystem path, which needs to be converted
						// to long UNC path.
						return '\\\\?\\' + resolvedPath ;
					} else if (/^\\\\[^?.]/.test(resolvedPath)) {
						// path is network UNC path, which needs to be converted
						// to long UNC path.
						return '\\\\?\\UNC\\' + resolvedPath.substring(2) ;
					}

					return path ;
				}
			}
		} ;
	}) ;
	
	var Assert = Type.define(function(){
		return {
			pkg:'test::Assert',
			domain:Type.appdomain,
			constructor:Assert = function Assert(){
				
			},
			fail:function fail(actual, expected, message, operator){
				
				
			},
			equal:function equal(actual, expected, message/*Arr*/){},
			notEqual:function notEqual(actual, expected, message/*Arr*/){},
			deepEqual:function deepEqual(actual, expected, message/*Arr*/){},
			notDeepEqual:function notDeepEqual(actual, expected, message/*Arr*/){},
			strictEqual:function strictEqual(actual, expected, message/*Arr*/){},
			notStrictEqual:function notStrictEqual(actual, expected, message/*Arr*/){},
			throws:function throws(block, error/*Arr*/, message/*Arr*/){},
			doesNotThrow:function doesNotThrow(block, error/*Arr*/, message/*Arr*/){},
			ifError:function ifError(value){}
		} ;
	}) ;
	
	
})) ;