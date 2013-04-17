'use strict' ;
(function(){
	
	var name_r = /function([^\(]+)/, pkg_r = /::(.+)$/, abs_r = /^\//, sl = Array.prototype.slice, DEFS = {}, PKG_SEP = '::',
	getctorname = function(cl, name){ return (cl = cl.match(name_r))? cl[1].replace(' ', ''):'' },
	keep_r = /constructor|hashCode|hashcode|toString/,
	retrieve = function retrieve(from, prop, p){ try { p = from[prop] ; return p } finally { if(prop != 'constructor') from[prop] = undefined , delete from[prop] }},
	merge = function(from, into){ for(var s in from) if(s != 'constructor'){ into[s] = from[s]; from[s] = undefined;} },
	toArray = function toArray(arr, p, l){	p = p || [], l = arr.length ; while(l--) p.unshift(arr[l]) ; return p },
	PKG = {} ;
	var Type = {
		globals:{},
		appdomain:window,
		guid:0,
		format:function format(type){
			var l ;
			if(!type) return type ; // cast away undefined & null
			if(!!type.slot) return type ; // cast away custom classes
			if(!!type.hashcode) return Type.getDefinitionByHash(type) ; // is a slot object
			if(typeof type == 'number') return Type.getDefinitionByHash(type) ;
			if(typeof type == 'string') return Type.getDefinitionByName(type) ;
			if(!!type.slice && type.slice === sl && (l = type.length)) for(var i = 0 ; i < l ; i++) type[i] = format(type[i]) ;
			return type ;
		},
		hash:function hash(qname){
			for (var i = 0 , h = 0 ; i < qname.length ; i++) h = 31 * ((h << 31) - h) + qname.charCodeAt(i), h &= h ;
			return h ;
		},
		define:function define(properties){
			if(typeof properties == 'function') return Type.define(properties()) ;
			var staticinit , isinterface = false ;
			var domain = retrieve(properties, 'domain') ;
			var superclass = retrieve(properties, 'inherits') ;
			var interfaces = retrieve(properties, 'interfaces') ;
			var statics = retrieve(properties, 'statics') ;
			var protoinit = retrieve(properties, 'protoinit') ;
			var def = retrieve(properties, 'constructor') ;
			var pkg = retrieve(properties, 'pkg') || '' ;
			if( pkg.indexOf('@')!= -1 ){
				isinterface = true ;
				pkg = pkg.replace('@', '') ;
			}
			var name = def == Object ? '' : (def.name || getctorname(def.toString())).replace(/Constructor$/, '') ;
			
			if(pkg_r.test(pkg)) pkg = pkg.replace(pkg_r, function(){name = arguments[1]; return ''}) ;
			if(!!Type.hackpath) pkg = abs_r.test(pkg) ? pkg.replace(abs_r, '') : pkg !='' ? Type.hackpath +'.'+ pkg : Type.hackpath ;
			if(name == '' ) name = 'Anonymous'+(++Type.guid) ;
			if(def == Object) def = Function('return function '+name+'(){\n\t\n}')() ;
			// set defaults
			
			var writable = !!domain ;
			domain = domain || Type.appdomain ;
			superclass = Type.format(superclass) || Object ;
			interfaces = Type.format(interfaces) || [] ;
			
			// set hashCode here
			var qname = pkg == '' ? name : pkg + PKG_SEP + name ;
			var hash = Type.hash(qname) ;
			// write classes w/ hash reference and if domain is specified, in domain
			(DEFS[hash] = def).slot = {
				appdomain:domain,
				qualifiedclassname:name,
				pkg:pkg,
				fullqualifiedclassname:qname,
				hashcode:hash,
				isinterface:isinterface,
				toString:function toString(){ return 'Type@'+qname+'Definition'}
			} ;
			def.toString = function toString(){ return '[' + ( isinterface ? "interface " : "class " ) + qname + ']' }
			writable && (domain[name] = def) ; // Alias checks, we don't want our anonymous classes to endup in window or else
			(!!Type.hackpath) && Pkg.register(qname, def) ;
			var T = function(){
				// set base & factory references
				def.base = superclass ;
				def.factory = superclass.prototype ;
				// write overrides
				merge(properties, this) ;
				this.constructor = def ;
			}
			T.prototype = superclass.prototype ;
			def.prototype = new T() ;
			// protoinit 
			if (!!protoinit) protoinit.apply(def.prototype, [def, domain]) ;
			if (!!statics) {
				staticinit = retrieve(statics, 'initialize') ;
				merge(statics, def) ;
			}
			// static initialize
			if(!!staticinit) staticinit.apply(def, [def, domain]) ;
			Type.implement(def, interfaces.concat(superclass.slot ? superclass.slot.interfaces || [] : []), domain) ;
			return def ;
		},
		implement:function implement(definition, interfaces){
			var c, method, cname, ints = definition.slot.interfaces = definition.slot.interfaces || [] ;
			if(!!interfaces.slice && interfaces.slice === sl) {
				for(var i = 0, l = interfaces.length ; i < l ; i++) {
					c = interfaces[i].prototype , cname = interfaces[i].slot.fullqualifiedclassname ;
					for (method in c) {
						if(keep_r.test(method)) continue ;
						
						if(!definition.prototype.hasOwnProperty(method)) throw new TypeError("NotImplementedMethodException "+c.constructor.slot.pkg+'.@'+c.constructor.slot.qualifiedclassname+"::" + method + "() absent from class " + definition.slot.fullqualifiedclassname) ;
					}
					ints[ints.length] = cname ;
				}
			}else ints[ints.length] = interfaces.slot.fullqualifiedclassname ;
			return definition ;
		},
		is:function is(instance, definition){ return instance instanceof definition },
		definition:function definition(qobj, domain){return Type.getDefinitionByName(qobj, domain)},
		getType:function getType(type){ return (!!type.constructor && !!type.constructor.slot) ? type.constructor.slot : type.slot || 'unregistered_type'},
		getQualifiedClassName:function getQualifiedClassName(type){ return Type.getType(type).toString() },
		getFullQualifiedClassName:function getFullQualifiedClassName(type){ return Type.getType(type).fullqualifiedclassname },
		getDefinitionByName:function getDefinitionByName(qname, domain){ return (domain || Type.appdomain)[qname] || Type.globals[qname] || DEFS[Type.hash(qname)]},
		getDefinitionByHash:function getDefinitionByHash(hashcode){ return DEFS[hashcode] },
		getAllDefinitions:function getAllDefinitions(){ return DEFS }
	}
	
	var Pkg = {
		register:function register(path, definition){
			if(arguments.length > 2){
				var args = [].slice.call(arguments) ;
				var pp = args.shift(), ret ;
				for(var i = 0, l = args.length ; i < l ; i++)
					ret = Pkg.register(pp, args[i]) ;
				return ret;
			}if(!!definition.slot) // is already result of Type.define()
				path = definition.slot.fullqualifiedclassname ;
			else { // transform it into Type.define() result
				definition.pkg = path ;
				definition = Type.define(definition) ;
				path = definition.slot.fullqualifiedclassname ;
			}
			return (PKG[path] = definition) ;
		},
		write:function write(path, obj){
			var oldpath = Type.hackpath ;
			try{
				// if obj is an Array
				if(obj.slice === sl) {
					for(var i = 0 , arr = [], l = obj.length ; i < l ; i ++)
						// if is an anonymous object, but with named References to write
						arr[arr.length] = write(path, obj[i]) ;
					return arr[arr.length - 1] ;
				}
				// if a function is passed
				else if(typeof obj == 'function'){
					if(!!obj.slot) return Pkg.register(path, obj) ;
					Type.hackpath = !!oldpath && !abs_r.test(path) ? oldpath + '.' +path : path.replace(abs_r, '') ;
					var o = new (obj)(path) ;
					if(o.slice === sl){
						for(var i = 0 ; i < o.length ; i++){
							var oo = o[i] ;
							if(!!oo.slot) write(path, oo) ;
						}
						return o ;
					}
					return (!!o) ? !!o.slot ? write(path, o) : undefined : undefined ;
				}
				// if anonymous object is passed
				else {
					return Pkg.register.apply(Pkg, sl.call(arguments)) ;
				}
			}catch(e){ trace(e) } finally {
				Type.hackpath = oldpath ; if(!!!oldpath) delete Type.hackpath ;
			}
		},
		definition:function definition(path){ return PKG[path] || Type.globals[path] },
		getAllDefinitions:function getAllDefinitions(){ return PKG }
	}
	
	// GLOBALS
	window.trace = function trace(){
		if(window.console === undefined) return arguments[arguments.length - 1] ;
		if('apply' in console.log) console.log.apply(console, arguments) ;
		else console.log([].concat([].slice.call(arguments))) ;
		return arguments[arguments.length - 1] ;
	}
	
	window.Type = Type ;
	window.Pkg = Pkg ;
	
	
	Pkg.write('org.libspark.straw.core', function(){
		
		var checkBase = function checkBase(){
			var scripts ;
			var scriptsH = toArray(document.getElementsByTagName("head")[0].getElementsByTagName("script")) ;
			if(!!document.getElementsByTagName("body")[0]){ // if is called within head or within body
				var scriptsB = toArray(document.getElementsByTagName("body")[0].getElementsByTagName("script")) ;
				scripts = scriptsH.concat(scriptsB) ;
			}else{
				scripts = scriptsH ;
			}
			
			var l = scripts.length ;
			var scr, root ;
			while(l--){
				var scr = scripts[l] ;
				root = scr.getAttribute('src') ;
				if(/strawnode.js\?[^\?]+$/.test(root)) break ;
			}
			
			return {
				root:root.replace(/strawnode.js\?[^\?]+$/, ''),
				app:root.replace(/[^\?]+\?(starter)=/, ''),
				base:location.protocol + '//' + location.host + location.pathname
			}
		}
		var retrieveQS = function(str){
			var p = {} ; 
			str.replace(/[^&]+/g, function($0){	p[$0.replace(/=.+$/, '')] = $0.replace(/.+[^=]=/, '') ; return ''})
			return p ;
		}
		var simfunc = function(resp, module, url){
			ModuleLoader.packed.push(resp) ;
			return new Function('module', '__filename', '__dirname', '__parameters', 'with(module){' + resp + '};return module;')(module, url, ModuleLoader.root, ModuleLoader.params) ;
		} ;
		
		var pathes = checkBase() ;
		var base = pathes.base ;
		var app = pathes.app ;
		var root = pathes.root ;
		var main = app.indexOf('./') == 0 ? app : './'+app ;
		
		main += '?base='+ base ;
		
		
		var cache = {} ;
		var path_r = /^[.]{0,2}\// ;
		var ext_r = /[.](js)$/ ;
		var abs_r = /^\// ;
		var folder_r = /\/[^\/]+$/ ;
		var internaluse = false ;
		
		var ModuleLoader = Type.define(function(){
			var bank = [
				function () {return new XMLHttpRequest()},
				function () {return new ActiveXObject("Msxml2.XMLHTTP")},
				function () {return new ActiveXObject("Msxml3.XMLHTTP")},
				function () {return new ActiveXObject("Microsoft.XMLHTTP")}
			] ;
			var modcache = {} ;
			var generateXHR = function generateXHR() {
				var xhttp = false;
				var l = bank.length ;
				for (var i = 0 ; i < l ; i++) {
					try {
					   xhttp = bank[i]();
					}
					catch (e) {
					   continue;
					}
					break;
				}
				return xhttp;
			} ;
			
			return {
				statics:{
					root:root,
					params:undefined,
					packed:[]
				},
				pkg:'load',
				domain:Type.globals,
				constructor:ModuleLoader = function ModuleLoader(url, complete, postData){
					var r = generateXHR() ;
					if (!r) return ;
					this.request = r ;
					this.url = ModuleLoader.root + url ;
					this.complete = complete ;
					
					this.userData = {
						post_data:postData,
						post_method:postData ? "POST" : "GET",
						ua_header:{ua:'User-Agent',ns:'XMLHTTP/1.0'},
						post_data_header: postData !== undefined ? {content_type:'Content-type',ns:'application/x-www-form-urlencoded'} : undefined 
					} ;	
				},
				load:function load(url, async, force){
					var r = this.request ;
					var th = this ;
					var ud = this.userData ;
					var complete = this.complete ;
					this.failed = false ;
					
					var loc = !!url ? ModuleLoader.root + url : this.url ;
					
					if(loc in modcache){
						this.response = modcache[loc] ;
						if(async && !!th.complete) th.complete(r, th) ;
						return this ;
					}
					
					if(async === false){
						ud['post_method'] = 'GET' ;
						
						r.open(ud['post_method'], loc, false) ;                             
						r.onreadystatechange = function () {
							if (r.readyState != 4) return;
							if (r.status != 200 && r.status != 304) {
								th.failed = true ;
								if(!!th.onerror) th.onerror(r) ;
								return ;
							}
						}
						r.send(null) ;
						this.response = modcache[loc] = this.request.responseText ;
						if(!!th.complete) th.complete(r, th) ;
						return this ;   
					}else{
						r.open(ud['post_method'] , loc, async || true) ;
						if (ud['post_data_header'] !== undefined) r.setRequestHeader(ud['post_data_header']['content_type'],ud['post_data_header']['ns']) ;
						r.onreadystatechange = function () {
							if (r.readyState != 4) return;
							if (r.status != 200 && r.status != 304) {
								th.failed = true ;
								if(!!th.onerror) th.onerror(r) ;
								return ;
							}
							th.response = modcache[loc] = th.request.responseText ;
							if(!!th.complete) th.complete(r, th) ;
						}
						if (r.readyState == 4) return ;
						r.send(ud['postData']) ;
						return this ;
					}
				},
				destroy:function destroy(){
					var ud = this.userData ;
					for(var n in ud){
						ud[n] = undefined ;
						delete ud[n] ;
					}
					this.descriptor =
					this.response = 
					this.userData =
					this.url =
					this.request =
					this.failed =
					undefined ;
					
					delete this.descriptor ;
					delete this.response ;
					delete this.userData ;
					delete this.url ;
					delete this.request ;
					delete this.failed ;

					return undefined ;
				}
			} ;
		}) ;
		
		var Module = Type.define({
			pkg:'modules',
			domain:Type.globals,
			constructor:Module = function Module(id, filename){
				this.id = id ;
				this.filename = filename ;
				this.loaded = false ;
				this.exports = {} ;
			},
			destroy:function destroy(){
				this.id =
				this.filename = 
				this.loaded = 
				this.exports = 
					undefined ;
					
				delete this.id ;
				delete this.filename ;
				delete this.loaded ;
				delete this.exports ;
				
				return undefined ;
			}
		}) ;
		
		var as_file = function as_file(filename){
			var url = filename ;
			var old = ModuleLoader.root ;
			var oldpath = Type.hackpath ;
			var mod, resp, r ;
			
			mod = new ModuleLoader(url).load(undefined, false) ;
			if(mod.failed) return as_dir(filename) ;
			
			resp = mod.response ;
			
			ModuleLoader.root = ModuleLoader.root + url.replace(folder_r, '/') ;
			Type.hackpath = '' ;
			
			r = simfunc(resp, new Module(filename, url), url) ;
			
			ModuleLoader.root = old ;
			Type.hackpath = oldpath ;
			
			mod = mod.destroy() ;
			return r ;
		}
		
		var as_dir = function as_dir(filename){
			var baseurl = filename +'/' ;
			var url = baseurl + 'package.json' ;
			var old = ModuleLoader.root ;
			var oldpath = Type.hackpath ;
			var mod, resp, r ;
			
			mod = new ModuleLoader(url).load(undefined, false) ;
			if(mod.failed){
				
				url =  baseurl + 'index.js' ;
				mod.load(url, false) ;
				resp = mod.response ;
				
				if(mod.failed) throw new Error('ModuleNotFoundError', url) ;
				
				ModuleLoader.root = ModuleLoader.root + baseurl ;
				Type.hackpath = '' ;
				
				r = simfunc(resp, new Module(filename, url), url) ;
				
				ModuleLoader.root = old ;
				Type.hackpath = oldpath ;
				
				mod = mod.destroy() ;
				return r ;
			}
			
			resp = mod.response ;
			
			var params = new Function('return '+resp)() ;
			url = baseurl + (params.main || params.index);
			mod.load(url, false) ;
			if(mod.failed) throw new Error('ModuleNotFoundError', url) ;
			
			resp = mod.response ;
			ModuleLoader.root = ModuleLoader.root + url.replace(folder_r, '/') ;
			Type.hackpath = '' ;
			
			if(params.dependencies){
				internaluse = true ;
				
				for(var arr = params.dependencies, l = arr.length, i = 0 ; i < l ; i++)
					require(arr[i]) ;
					
				internaluse = false ;
			}
			
			r = simfunc(resp, new Module(filename, url), url) ;
			
			
			ModuleLoader.root = old ;
			Type.hackpath = oldpath ;
			
			mod = mod.destroy() ;
			return r ;
		}
		
		var as_node_mods = function as_node_mods(filename){
			var baseurl = 'node_modules/' ;
			var url = baseurl + filename ;
			var old = ModuleLoader.root ;
			var oldpath = Type.hackpath ;
			var mod, resp, r ;
			
			mod = new ModuleLoader(url).load(undefined, false) ;
			if(mod.failed) throw new Error('ModuleNotFoundError', url) ;
			
			resp = mod.response ;
			
			ModuleLoader.root = ModuleLoader.root + baseurl ;
			Type.hackpath = '' ;
			
			r = simfunc(resp, new Module(filename, url), url) ;
			
			ModuleLoader.root = old ;
			Type.hackpath = oldpath ;
			
			mod = mod.destroy() ;
			return r ;
		}
		// REQUIRE
		var require = window.require = function require(id){ // id is always string
			var s ;
			// cache checks
			if(!!(s = cache[id])) return s instanceof Module ? s.exports : s ;
			// if id is core module [ended inevitabely in window]
			if(!!(s = window[id])) return s instanceof Module ? s.exports : s ;
			
			if(!!(s = Type.getDefinitionByName(id))) return s instanceof Module ? s.exports : s ;
			// if is present as name/id in Type definitions
			else if(!!(s=Type.getDefinitionByName(id))) return s instanceof Module ? s.exports : s ; 
			var params ;
			if(/\?/.test(id)){
				id = id.replace(/\?.+/, function($1){
					params = $1.replace(/\?/, '') ;
					return '' ;
				}) ;
				if(!internaluse) ModuleLoader.params = retrieveQS(params) ;
			}else{
				if(!internaluse)ModuleLoader.params = undefined ;
			}
			
			var isAbs = abs_r.test(id), old = ModuleLoader.root ;
			if(isAbs) ModuleLoader.root = root ;
			// checks upon input str format
			if(path_r.test(id))
				if(ext_r.test(id)) s = as_file(id) ;
				else s = as_dir(id) ;
			else if(ext_r.test(id)) s = as_node_mods(id) ;
			else s = as_dir(id) ;
			
			if(isAbs)
				ModuleLoader.root = old ;
			
			cache[id] = s ;
			return s instanceof Module ? s.exports : s ;
		}
		
		require.cache = cache ;
		require(main) ;
		
	}) ;
	
	
})() ;






