/*
 * StrawExpress
 * Base Webapp-oriented Framework, along with StrawNode
 * 
 * V 1.0.0
 * 
 * Dependancies : 
 * 	jQuery 1.6.1+ (event handling)
 * 	jquery-ba-hashchange (cross-browser hashchange event)
 * 
 * author saz aka True
 * 
 * licensed under GNU GPL-General Public License
 * copyright sazaam[(at)gmail.com]
 * 2011-2013
 * 
 */
 
'use strict' ;

(function(name, definition){
	
	if ('function' === typeof define){ // AMD
		define(definition) ;
	} else if ('undefined' !== typeof module && module.exports) { // Node.js
		module.exports = ('function' === typeof definition) ? definition() : definition ;
	} else {
		if(definition !== undefined) this[name] = ('function' === typeof definition) ? definition() : definition ;
	}
	
})('Express', Pkg.write('org.libspark.straw', function(){

	/* UTILS */
	var CodeUtil = Type.define({
		pkg:'utils::CodeUtil',
		domain:Type.appdomain,
		statics:{
			overwritesafe:function overwritesafe(target, propname, propvalue){
				if(!!! target[propname])
					target[propname] = propvalue ;
			}
		}
	}) ;
	
	var StringUtil = Type.define({
		pkg:'utils::StringUtil',
		domain:Type.appdomain,
		statics:{
			SPACE:' ',
			SLASH:'/',
			HASH:'#',
			AROBASE:'@',
			DOLLAR:'$',
			EMPTY:''
		}
	}) ;
	
	var ArrayUtil = Type.define({
		pkg:'utils::ArrayUtil',
		domain:Type.appdomain,
		statics:{
			isArray:function(obj){
				return Type.is(obj, Array) ;
			},
			slice:[].slice,
			argsToArray:function(args){
				return args.length ? ArrayUtil.slice.call(args) : [] ;
			},
			indexOf:function(arr, obj){
				if('indexOf' in arr) return arr.indexOf(obj) ;
				
				for(var i = 0 , l = arr.length ; i < l ; i++ )
					if(arr[i] === obj) break ;
				
				return i ;
			}
		}
	}) ;
	
	var PathUtil = Type.define({
		pkg:'utils::PathUtil',
		domain:Type.appdomain,
		statics:{
			abs_hash_re:/#/,
			hash_re:/^\/#\//,
			startslash_re:/^\//,
			safe_startslash_re:/(^\/)?/,
			endslash_re:/\/$/,
			safe_endslash_re:/(\/)?$/,
			bothslash_re:/(^\/|\/$)/g,
			multiplesep_re:/(\/){2,}/g,
			undersore_re:/_/g,
			path_re:/^[^?]+/,
			qs_re:/\?.*$/,
			replaceUnderscores:function(str){
				return (!!str) ? str.replace(PathUtil.endslash_re, StringUtil.SPACE) : str ;
			},
			hasMultipleSeparators:function(str){
				return (!!str) ? PathUtil.multiplesep_re.test(str) : str ;
			},
			removeMultipleSeparators:function(str){
				return (!!str) ? str.replace(PathUtil.multiplesep_re, StringUtil.SLASH) : str ;
			},
			trimlast:function trimlast(str){
				return (!!str) ? str.replace(PathUtil.endslash_re, StringUtil.EMPTY) : str ;
			},
			trimfirst:function trimfirst(str){
				return (!!str) ? str.replace(PathUtil.startslash_re, StringUtil.EMPTY) : str ;
			},
			trimall:function trimfirst(str){
				return (!!str) ? str.replace(PathUtil.bothslash_re, StringUtil.EMPTY) : str ;
			},
			ensurelast:function ensurelast(str){
				return (!!str) ? str.replace(PathUtil.safe_endslash_re, StringUtil.SLASH) : str ;
			},
			ensurefirst:function ensurefirst(str){
				return (!!str) ? str.replace(PathUtil.safe_startslash_re, StringUtil.SLASH) : str ;
			},
			ensureall:function ensureall(str){
				return (!!str) ? PathUtil.ensurelast(PathUtil.ensurefirst(str)) : str ;
			},
			endslash:function endslash(str){
				return (!!str) ? PathUtil.endslash_re.test(str) : str ;
			},
			startslash:function startslash(str){
				return (!!str) ? PathUtil.startslash_re.test(str) : str ;
			},
			allslash:function allslash(str){
				return (!!str) ? PathUtil.startslash(str) &&  PathUtil.endslash(str) : str ;
			},
			eitherslash:function eitherslash(str){
				return (!!str) ? PathUtil.bothslash_re.test(str) : str ;
			}
		}
	}) ;
	
	/* NET */
	var AjaxRequest = Type.define({
		pkg:'net',
		domain:Type.appdomain,
		statics:{
			namespaces:[
				function () {return new XMLHttpAjaxRequest()},
				function () {return new ActiveXObject("Msxml2.XMLHTTP")},
				function () {return new ActiveXObject("Msxml3.XMLHTTP")},
				function () {return new ActiveXObject("Microsoft.XMLHTTP")}
			],
			generateXHR:function() {
				var xhttp = false ;
				var bank = AjaxRequest.namespaces ;
				var l = bank.length ;
				for (var i = 0 ; i < l ; i++) {
					try {
						xhttp = bank[i]() ;
					}
					catch (e) {
						continue ;
					}
					break;
				}
				return xhttp ;
			}
		},
		constructor:AjaxRequest = function AjaxRequest(url, complete, postData) {
			var r = AjaxRequest.generateXHR() ;
			if (!r) throw 'AjaxRequest Error : trying to load outside of an Ajax Context (Server-like)' ;
			this.request = r ;
			this.url = url ;
			this.complete = complete ;
			this.userData = {
				post_data:postData,
				post_method:postData ? "POST" : "GET",
				ua_header:{ua:'User-Agent',ns:'XMLHTTP/1.0'},
				post_data_header: !!postData ? {content_type:'Content-type',ns:'application/x-www-form-urlencoded'} : undefined 
			} ;
		},
		load:function(url){
			var r = this.request ;
			var th = this ;
			var ud = this.userData ;
			var complete = this.complete ;
			r.open(ud['post_method'] , url || this.url, true) ;
			if (!!ud['post_data_header']) r.setAjaxRequestHeader(ud['post_data_header']['content_type'],ud['post_data_header']['ns']) ;
			r.onreadystatechange = function () {
				if (r.readyState != 4) return;
				if (r.status != 200 && r.status != 304) {
					return ;
				}
				th.complete(r, th) ;
			}
			if (r.readyState == 4) return ;
			r.send(ud['postData']) ;
			return this ;
		},
		destroy:function(){
			var ud = this.userData ;
			
			for(var n in ud){
				delete ud[n] ;
			}
			
			delete this.postData ;
			delete this.request ;
			delete this.url ;
			
			return undefined ;
		}
	}) ;
	
	/* PROXIES */
	var Proxy = Type.define(function(){
		var ns = {}, __global__ = window, returnValue = function(val, name){return val },
		toStringReg = /^\[|object ?|class ?|\]$/g ,
		DOMClass = function (obj) {
		
			if(!!obj.constructor && !!obj.constructor.prototype) return obj.constructor ;
			var tname = obj.tagName, kl, trans = { // Prototype.js' help here
			  "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph","FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList","DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading","H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote","INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION":"TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD":"TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":"TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET":"FrameSet", "IFRAME": "IFrame", 'DIV':'Div', 'DOCUMENT':'Document', 'HTML':'Html', 'WINDOW':'Window'
			};
			
			if(!!!tname) {
				if(obj === window){
					tname = 'WINDOW' ;
				}else
				
				for(var s in window){
					if(obj == window[s]) {
						tname = s.toUpperCase() ;
						break ;
					}
				}
			}
			
			if(!! trans[tname]) kl = (tname == 'Window') ? trans[tname] : 'HTML' + trans[tname] + 'Element' ;
			else kl = tname.replace(/^(.)(.+)$/, '$1'.toUpperCase() + '$2'.toLowerCase()) ;
			if(!!! __global__[kl] ) { 
				__global__[kl] = { } ;
				__global__[kl].prototype = document.createElement(tname)['__proto__'] ;
				__global__[kl].toString = function(){ return '[object '+kl+']' } ;
			}
			return window[kl] ;
		},
		getPropertyClosure = function(val, name, obj){
			var type = typeof val ;
			switch(type){
				case 'null': case 'undefined': case 'number': case 'string': case 'boolean':
					return function(){ return (arguments.length > 0 ) ? (obj[name] = arguments[0]) : obj[name] } ; break ;
				case 'object' :
					return function(o, o2){
						if(!!o){
							var tt = typeof o, ob = obj[name] ;
							if(tt == 'string' || tt == 'number') return (o2 === undefined) ? ob[o] : (ob[o] = o2) ;
							for(var s in o)
								ob[s] = o[s] ;
							return obj[name] ;
						}else return obj[name] ;
					} ; break ;
				case 'function' : return function(){ return obj[name].apply(obj, arguments) } ; break ;
				default : return val ; break ;
			}
		} ;
		
		return {
			pkg:'proxies',
			domain:Type.appdomain,
			statics:{
				getProxy:function(target){ return target['__proxy__'] },
				Class:function(t, o){return new Proxy(t, o, true) }
			},
			constructor:Proxy = function Proxy(target, override, toClass){
				
				var obj = target, cl = target.constructor, withoutnew = (this === __global__), tobecached = false, clvars, ret, func ;
				var name_r = /function([^\(]+)/ ;
				var getctorname = function(cl, name){ return (cl = cl.match(name_r))? cl[1].replace(' ', ''):'' } ;
				tobecached = (withoutnew) ? true : false ;
				
				cl = (!!!cl) ? DOMClass(target).toString().replace(toStringReg, '') : cl.toString().replace(toStringReg, '') ;
				if(toClass === true) {
					tobecached = true ;
					cl = cl + 'Proxy' ;
				} ;
				
				
				
				if(cl.indexOf('function ') == 0) cl = cl.match(name_r)[1].replace(/^ /, '') ;
				
				// if in cache
				if(!!ns[cl] && tobecached === true) {
					ret = ns[cl] ;
					return (toClass) ? ret : new ret(target) ;
				}
				
				var tg = target.constructor === Function ? target : target.constructor ;
				
				var name ;
				if(!!!tg) name = cl ;
				else name = tg == Object ? '' : (tg.name || getctorname(tg.toString())) ;
				
				
				var tar, over ;	
				tar = target ; over = override ;
				over.original = {} ;
				over.protoinit = function(){
					for(var s in tar) {
						if(s == 'constructor') continue ;	
						if(s == 'toString') continue ;	
						if(s == '__proxy__') continue ;	
						
						if(s in this){this.original[s] = getPropertyClosure(tar[s], s, tar) ;}
						else
							this[s] = getPropertyClosure(tar[s], s, tar) ;
					}
				} ;
				
				var out = tar['__proxy__'] = Type.define(over) ;
				out.base = tar.constructor ;
				out.factory = tar ;
				
				var store = function(r, ns, cl){
					if(tobecached === true) ns[cl] = r ;
					return r ;
				} ;
				
				ret = store(out, ns, cl) ;
				return (toClass) ? ret : new ret(target) ;
			}
		} ;
		
	}) ;
	
	/* EVENT */
	var IEvent = Type.define({
		pkg:'event::IEvent',
		domain:Type.appdomain,
		constructor:IEvent = function IEvent(type, data){
			this.timeStamp = + (new Date()) ;
			var signature = arguments.length ;
			
			if('string' == typeof type){
				this.type = type ;
			}else if(!!type.type){
				for(var s in type)
					this[s] = type[s] ;
			}else if(!!data){
				for(var s in data)
					this[s] = data[s] ;
			}
		}
	}) ;
	
	var EventDispatcher = Type.define({
		pkg:'event::EventDispatcher',
		domain:Type.appdomain,
		constructor:EventDispatcher = function EventDispatcher(tg){
			this.flag = 0 ;
			this._handlers = [] ;
			this._proxies = [] ;
			this._dispatcher = this ;
			
			if(!!tg) this.setDispatcher(tg) ;
		},
		_handlers:undefined,
		_addHandler:function(ind, type, closure){
			var h = this._handlers ;
			h[h.length] = {ind:ind, type:type, closure:closure} ;
			
			return true ;
		},
		_removeHandler:function(ind, type, closure){
			var handlers = this._handlers ;
			var h, l = handlers.length ;
			
			var i = (function(){
				for(var i = 0 ; i < l ; i++){
					h = handlers[i] ;
					if(h.closure === closure && h.ind == ind)
						return i ;
				}
				return -1 ;
			})() ;
			
			if(i == -1)
				throw new Error('EventDispatcher target not registered with type : "'+ type +'" and closure : ' + closure + '.' )
			
			delete h.closure ;
			delete h.type ;
			delete h.ind ;
			
			handlers.splice(i, 1) ;
			return true ;
		},
		registerFlag:function(cond, ind, closure, type){
			if(!! closure ){
				(cond) ? this._addHandler(ind, type, closure) : this._removeHandler(ind, type, closure) ;
			}
			(cond) ? this.flag |= ind : this.flag &= ~ind ;
		},
		setDispatcher:function(tg){
			if(!!tg && (!!tg.addEventListener || !!tg.attachEvent)) tg = new DOMEventDispatcherProxy(tg, this.willTrigger) ;
			// if tg comes undefined, means we want to erase behaviour,
			// but if comes with original 'this', we also want to erase proxy behaviour
			Global.setProxyListener(this, tg === this ? undefined : tg) ; 
		},
		bind:function(type, closure){
			return Global.bind(this, type, closure) ;
		},
		unbind:function(type, closure){
			return Global.unbind(this, type, closure) ;
		},
		trigger:function(e){
			return Global.trigger(this, e) ;
		},
		willTrigger:function(e){
			e = Global.format(e) ;
			return (e & this.flag) != 0 ;
		},
		destroy:function(){
			if(this._dispatcher !== this) this.setDispatcher() ;
			
			var handlers = this._handlers ;
			var proxies = this._proxies ;
			
			delete this.flag ;
			delete this._handlers ;
			delete this._proxies ;
			delete this._dispatcher ;
			
			return undefined ;
		}
	}) ;
	
	var Global = Type.define({
		pkg:'event::Global',
		domain:Type.appdomain,
		statics:{
			events:{},
			all:[],
			IEvent:IEvent,
			evtypeindex:0,
			setProxyListener:function(proxy, tg){
				var proxies ;
				
				if(proxy._dispatcher !== proxy || tg === proxy ){ // remove ici 
					
					if(proxy._dispatcher._proxies.length){
						proxies = proxy._dispatcher._proxies ;
						var i = ArrayUtil.indexOf(proxies, proxy) ;
						if(i !== -1) proxies.splice(i, 1) ;
					}
					
					if(proxy._dispatcher instanceof DOMEventDispatcherProxy){
					
						var handlers = proxy._handlers ;
						var l = handlers.length ;
						
						for(;l--;){
							var h = handlers[l] ;
							if(proxy.willTrigger(h.ind)){
								proxy._dispatcher.unbind(h.type, h.closure) ;
							}
						}
					}
					
					proxy._dispatcher = proxy ;
				}
				
				if(!!!tg) return proxy._dispatcher = proxy ;
				
				proxy._dispatcher = tg ;
				proxies = tg._proxies ;
				
				var i = ArrayUtil.indexOf(proxies, proxy) ;
				if(i == -1) {
					proxies.unshift(proxy) ;
					
					if(proxy._dispatcher instanceof DOMEventDispatcherProxy){
					
						var handlers = proxy._handlers ;
						var l = handlers.length ;
						
						for(var i = 0; i < l ; i++){
							var h = handlers[i] ;
							if(proxy.willTrigger(h.ind)){
								proxy._dispatcher.bind(h.type, h.closure) ;
							}
						}
					}
					
				}
				
			},
			addEventType:function(type){
				var ind = Global.evtypeindex == 0 ? (Global.evtypeindex+=1) : (Global.evtypeindex <<= 1) ;
				Global.events[type] = ind ;
				
				Global.allListeners(function(proxy){
					if(!proxy.willTrigger(ind)) proxy.registerFlag(false, ind, undefined, type) ;
				})
				
				return ind ;
			},
			allListeners:function(closure){
				for(var i = 0 ; i < Global.all.length ; i++){
					var tg = Global.all[i] ;
					return closure(tg, i) ;
				}
			},
			bind:function(tg, type, closure){
				var ind ;
				if(type in Global.events) ind = Global.events[type] ;
				else {
					ind = Global.addEventType(type) ;
				}
				
				tg.registerFlag(true, ind, closure, type) ;
				
				if(!!! tg.registered){
					Global.all[Global.all.length] = tg ;
					tg.registered ;
				}
				
				Global.checkDomProxy(true, tg, type, closure) ;
				
				return tg ;
			},
			unbind:function(tg, type, closure){
				var ind ;
				if(type in Global.events) ind = Global.events[type] ;
				else {
					throw new Error('cannot remove event : ' + + 'is not registered') ;
				}
				
				Global.checkDomProxy(false, tg, type, closure) ;
				
				tg.registerFlag(false, ind, closure, type) ;
			},
			checkDomProxy:function(cond, tg, type, closure){
				if(tg._dispatcher instanceof DOMEventDispatcherProxy){
					var handlers = tg._handlers ;
					var l = handlers.length ;
					
					for(var i = 0 ; i < l ; i++){
						var h = handlers[i] ;
						if(cond){
							if(h.type === type && h.closure === closure){
								tg._dispatcher.bind(type, closure) ;
							}
						}else{
							if(h.type === type && h.closure === closure){
								tg._dispatcher.unbind(h.type, h.closure) ;
							}
						}
					}
				}
			},
			trigger:function(tg, e){
				
				if(e in Global.events){
					var ind = Global.events[e] ;
					var proxies = tg._proxies ;
					
					if(proxies.length){
						
						var l = proxies.length ;
						for(var i = 0 ; i < l ; i ++){
							var p = proxies[i] ;
							Global.checkForCompatAndTrigger(p, e, tg) ;
						}
					}
					
					if(tg.willTrigger(ind)){
						Global.checkForCompatAndTrigger(tg, e) ;
					}
				}
			},
			format:function(e){
				if('string' === typeof e) return Global.events[e] ;
				if(e instanceof Global.IEvent) return Global.events[e.type] ;
				return e ;
			},
			checkForCompatAndTrigger:function(tg, e, curtg){
				var handlers = tg._handlers ;
				var l = handlers.length ;
				
				var ind = Global.format(e) ;
				
				for(var i = 0 ; i < l ; i++){
					var h = handlers[i] ;
					if(tg.willTrigger(e) && h.type == e)
						(h.closure.apply(tg, [new Global.IEvent({target:tg, type:e, currentTarget:tg, originalTarget:curtg || tg})])) ;
				}
			}
		}
	}) ;
	
	var DOMEventDispatcherProxy = Type.define({
		pkg:'event::DOMEventDispatcherProxy',
		domain:Type.appdomain,
		constructor:DOMEventDispatcherProxy = function DOMEventDispatcherProxy(tg, willTrigger){
			this._targetProxy = (tg) ;
			this._proxies = [] ;
			this.willTrigger = willTrigger ;
			return this ;
		},
		trigger:function(e){
			var s = this ;
			return ( this._targetProxy.fireEvent ) ?
				(function(){
					s._targetProxy.fireEvent('on' + e) ;	
				
				})() :
				(function(){
					if('string' === typeof e){
						var ev = document.createEvent('MouseEvents') ;
						ev.initEvent(e, true, false) ;
						e = ev ;
					}
					s._targetProxy.dispatchEvent(e) ;
				})()
		},
		bind:function bind(type, closure){
			return (!!this._targetProxy.attachEvent) ? 
				this._targetProxy.attachEvent('on'+type, closure) :
				this._targetProxy.addEventListener(type, closure, true) ;
		},
		unbind:function unbind(type, closure){
			return (!!this._targetProxy.detachEvent) ? 
				this._targetProxy.detachEvent('on'+type, closure) :
				this._targetProxy.removeEventListener(type, closure, true) ;
		},
		destroy:function(){
			var proxies = this._proxies ;
			var l = proxies.length ;
			for(;l--;){
				var p = proxies[l] ;
				if(Type.of(p['destroy'], 'function')) p = p.destroy() ;
				delete proxies[l] ;
			}
			
			delete this._proxies ;
			delete this.willTrigger ;
			delete this._targetProxy ;
			
			return undefined ;
		}
	}) ;
	
	/* COMMANDS */
	var Command = Type.define({
		pkg:'command',
		inherits:EventDispatcher,
		domain:Type.appdomain,
		constructor:Command = function Command(thisObj, closure, params) {
			Command.base.apply(this, []) ;

			var args = ArrayUtil.argsToArray(arguments) ;
			this.context = args.shift() ;
			this.closure = args.shift() ;
			this.params = args ;
			this.depth = '$' ;

			return this ;
		},
		execute : function(){
			var r = this.closure.apply(this, [].concat(this.params)) ;
			if(!!r) {
				return this ;
			}
		},
		dispatchComplete : function(){
			this.trigger(this.depth) ;
		},
		destroy : function(){
			
			delete this.context ; 
			delete this.closure ; 
			delete this.params ; 
			delete this.depth ;
			

			return Command.factory.destroy.apply(this, []) ;
		}
	}) ;
	var CommandQueue = Type.define({
		pkg:'command',
		inherits:Command,
		domain:Type.appdomain,
		constructor : function CommandQueue() {
			
			Command.base.apply(this, []) ;
			
			this.commands = arguments.length ? ArrayUtil.argsToArray(arguments) : [] ;
			this.commandIndex = -1 ;
			this.depth = '$' ;

			var cq = this ;

			this.add = function add(){
				var args = arguments ;
				var l = args.length ;
				switch(l)
				{
					case 0:
						throw new Error('cannot add an null object, ...commandQueue') ;
					break;
					case 1:
						var arg = args[0] ;
						if(Type.is(arg, Command)) cq.commands[cq.commands.length] = arg ;
						else // must be an array of commands
							if(Type.is(arg, Array)) add.apply(null, arg) ;
					break;
					default :
						for(var i = 0 ; i < l ; i++ ) add(args[i]) ;
					break;
				}
			}

			// if(commands.length > 0 ) this.add(commands) ;

			return this ;
		},
		reset : function(){
			if(this.commands.length){
				var commands = this.commands ;
				var l = commands.length ;
				for (;l--;) {
					var comm = commands[l];
					if(Type.is(comm, CommandQueue)) comm.commandIndex = -1 ;
				}
			}
			this.commandIndex = -1 ;
			return this ;
		},
		next : function(){
			var cq = this ;
			var ind = this.commandIndex ;
			ind ++ ;
			
			var c = this.commands[ind] ;
			if(!!!c){
				trace('commandQueue did not found command and will return, since command stack is empty...') ;
				setTimeout(function(){cq.dispatchComplete()}, 0) ; 
				return this ;
			}

			c.depth = this.depth + '$' ;

			var r = c.execute() ;

			if(!!!r){
				this.commandIndex = ind ;
			if(ind == this.commands.length - 1){
				this.dispatchComplete() ;
			}else{
				this.next() ;
			}
			}else{
				var type = c.depth ;
				var rrr ;
				r.bind(type, rrr = function(){
					r.unbind(type, rrr) ;
					cq.commandIndex = ind ;
					ind == cq.commands.length - 1
						? cq.dispatchComplete() 
						: cq.next() ;
				})
			}
			
			return this ;
		},
		execute : function(){
			return this.next() ;
		},
		destroy : function(){
			// trace('destroying', this)
			if(!!this.commands){
				var commands = this.commands ;
				var l = commands.length ;
				for (;l--;)
					commands.pop().destroy() ;
			}
			delete this.add ;
			delete this.commands ; 
			delete this.commandIndex ; 
			
			return CommandQueue.factory.destroy.apply(this, []) ;
		}
	}) ;
	var WaitCommand = Type.define({
		pkg:'command',
		inherits:Command,
		domain:Type.appdomain,
		constructor:WaitCommand = function WaitCommand(time, initclosure) {
			WaitCommand.base.call(this) ;

			this.time = time ;
			this.depth = '$' ;
			this.uid = -1 ;
			this.initclosure = initclosure ;

			return this ;
		},
		execute:function(){
			var w = this ;
			
			if(!! w.initclosure) {
				var co = new Command(w, w.initclosure) ;
				var o = co.execute() ;
				var rrr ;
				if(!! o ){
					co.bind('$', rrr = function(e){
						co.unbind('$', rrr) ;
						this.uid = setTimeout(function(){
							w.dispatchComplete() ;
							this.uid = -1 ;
						}, this.time) ;
					}) ;
				}else{
					this.uid = setTimeout(function(){
						w.dispatchComplete() ;
						this.uid = -1 ;
					}, this.time) ;
				}
			}else{
				this.uid = setTimeout(function(){
					w.dispatchComplete() ;
					this.uid = -1 ;
				}, this.time) ;
			}

			return this ;
		},
		destroy:function(){

			if(this.uid !== -1){
				clearTimeout(this.uid) ;
			}
			delete this.uid ;
			delete this.time ;
			delete this.initclosure ;
			
			return WaitCommand.factory.destroy.apply(this, []) ;
		}
	}) ;
	var AjaxCommand = Type.define({
		pkg:'command',
		inherits:Command,
		domain:Type.appdomain,
		constructor:AjaxCommand = function AjaxCommand(url, success, postData, init) {
			if(postData === null) postData = undefined ;

			AjaxCommand.base.call(this) ;

			this.url = url ;
			this.success = success ;
			this.postData = postData ;
			this.depth = '$' ;
			
			this.initclosure = init ;
			
			return this ;
		},
		execute : function(){
			var w = this ;
			if(!! w.request && !! w.success ) return w.success.apply(w, [w.jxhr, w.request]) ;
			w.request = new AjaxRequest(w.url, function(jxhr, r){
				w.jxhr = jxhr ;
				if(!! w.success )w.success.apply(w, [jxhr, r]) ;
			}, w.postData) ;

			if(!! w.initclosure ) w.initclosure.apply(w, [w.request]) ;
			if(!! w.toCancel ) {
				setTimeout(function(){
					w.dispatchComplete() ;
				}, 10) ;
				return w;
			}
			setTimeout(function(){w.request.load()}, 0) ;
			
			return this ;
		},
		destroy : function(){
			if(!!this.request) this.request = this.request.destroy() ;
			
			delete this.request ;
			delete this.url ;
			delete this.success ;
			delete this.postData ;
			delete this.initclosure ;
			
			return AjaxCommand.factory.destroy.apply(this, []) ;
		}
	}) ;

	/* STEP */
	var Step = Type.define({
		pkg:'step',
		inherits:EventDispatcher,
		domain:Type.appdomain,
		statics:{
			// STATIC VARS
			hierarchies:{},
			getHierarchies:function (){ return Step.hierarchies },
			// STATIC CONSTANTS
			SEPARATOR:StringUtil.SLASH,
			STATE_OPENED:"opened",
			STATE_CLOSED:"closed"
		},
		commandOpen:undefined,
		commandClose:undefined,
		id:'',
		path:'',
		label:undefined,
		depth:NaN,
		index:NaN,
		parentStep:undefined,
		defaultStep:undefined,
		ancestor:undefined,
		hierarchyLinked:false,
		children:[],
		opened:false,
		opening:false,
		closing:false,
		playhead:NaN,
		looping:false,
		isFinal:false,
		way:'forward',
		state:'',
		userData:undefined,
		loaded:false,
		
		// CTOR
		constructor:Step = function Step(id, commandOpen, commandClose){
			Step.base.apply(this, []) ;
			
			this.id = id ;
			this.label = PathUtil.replaceUnderscores(this.id) ;
			this.children = [] ;
			this.alphachildren = {} ;
			this.depth = 0 ;
			this.index = -1 ;
			this.playhead = -1 ;
			this.userData = { } ;
			this.isFinal = false ;
			
			this.settings(commandOpen, commandClose) ;
		},
		settings:function(commandOpen, commandClose){
			var overwritesafe = CodeUtil.overwritesafe ;
			overwritesafe(this, 'commandOpen', commandOpen) ;
			overwritesafe(this, 'commandClose', commandClose) ;
		},
		reload:function(){
			var st = this ;
			var c = st.commandClose ;
			var $complete ;
			
			c.bind('$', $complete = function(e){
				c.unbind('$', $complete) ;
				s.open() ;
			}) ;
			
			st.close() ;
		},
		open:function(){
			var st = this ;
			
			if( st.opened && !st.closing) throw new Error('currently trying to open an already-opened step ' + st.path + ' ...')
			st.opening = true ;
			
			if (st.isOpenable()) {
				var o = st.commandOpen.execute() ;
				st.dispatchOpening() ;
				
				if (!!o){
					if(!Type.is(o, EventDispatcher)) throw new Error('supposed-to-be eventDispatcher is not one...', o) ;
					var rrr ;
					o.bind(st.commandOpen.depth, rrr = function(e){

						o.unbind(st.commandOpen.depth, rrr) ;
						st.checkOpenNDispatch() ;
						
					}) ;
				}else st.checkOpenNDispatch() ;
			}else st.checkOpenNDispatch() ;
		},
		close:function(){
			var st = this ;
			if ( !st.opened && !st.opening) throw new Error('currently trying to close a non-opened step ' + st.path + ' ...')
			st.closing = true ;
			
			if (st.isCloseable()) {
				
				var o = st.commandClose.execute() ;
				st.dispatchClosing() ;
				if (!!o) {
					 if(!Type.is(o, EventDispatcher)) throw new Error('supposed-to-be eventDispatcher is not one...', o) ;
					 var rrr ;
					 o.bind(st.commandClose.depth, rrr = function(e){
						e.target.unbind(st.commandClose.depth, rrr) ;
						st.checkCloseNDispatch() ;
					 }) ;
				}else st.checkCloseNDispatch() ;
			}else st.checkCloseNDispatch() ;
		},
		checkOpenNDispatch:function(){ this.opened = true ; this.opening = false ; this.dispatchOpen() }, 
		checkCloseNDispatch:function(){ this.opened = false ; this.closing = false ; this.dispatchClose() },
		dispatchOpening:function(){ this.trigger('step_opening') },
		dispatchOpen:function(){ this.trigger('step_open') },
		dispatchClosing:function(){ this.trigger('step_closing') },
		dispatchClose:function(){ this.trigger('step_close') },
		dispatchOpenComplete:function(){ this.trigger(this.commandOpen.depth) },
		dispatchCloseComplete:function(){ this.trigger(this.commandClose.depth) },
		dispatchFocusIn:function(){ this.trigger('focusIn') },
		dispatchFocusOut:function(){ this.trigger('focusOut') },
		dispatchCleared:function(){ this.trigger('focus_clear') },
		
		// DATA DESTROY HANDLING
		destroy:function(){
			var st = this ;
			if (Type.is(st.parentStep, Step) && st.parentStep.hasChild(st)) st.parentStep.remove(st) ;
			
			if (st.isOpenable) st.commandOpen = st.destroyCommand(st.commandOpen) ;
			if (st.isCloseable) st.commandClose = st.destroyCommand(st.commandClose) ;
			
			if (!! st.userData ) st.userData = st.destroyObj(st.userData) ;
			
			if (st.children.length != 0) st.children = st.destroyChildren() ;
			if (Type.is(st.ancestor, Step) && st.ancestor == st) {
				if (st.id in Step.hierarchies) st.unregisterAsAncestor() ;
			}
			
			for(var s in this){
				delete this[s] ;
			}
			
			return undefined ;
		},
		destroyCommand:function(c){ return !! c ? c.destroy() : c },
		destroyChildren:function(){ if (this.getLength() > 0) this.empty(true) ; return undefined },
		destroyObj:function(o){
			for (var s in o) {
				o[s] = undefined ;
				delete o[s] ;
			}
			return undefined ;
		},
		
		setId:function setId(value){ this.id = value },
		getId:function getId(){ return this.id},
		getIndex:function getIndex(){ return this.index},
		getPath:function getPath(){ return this.path },
		getDepth:function getDepth(){ return this.depth },
		// OPEN/CLOSE-TYPE (SELF) CONTROLS
		isOpenable:function isOpenable(){ return Type.is(this.commandOpen, Command)},
		isCloseable:function isCloseable(){ return Type.is(this.commandClose, Command)},
		getCommandOpen:function getCommandOpen(){ return this.commandOpen },
		setCommandOpen:function setCommandOpen(value){ this.commandOpen = value },
		getCommandClose:function getCommandClose(){ return this.commandClose },
		setCommandClose:function setCommandClose(value){ this.commandClose = value },
		getOpening:function getOpening(){ return this.opening },
		getClosing:function getClosing(){ return this.closing },
		getOpened:function getOpened(){ return this.opened },
		// CHILD/PARENT REFLECT
		getParentStep:function getParentStep(){ return this.parentStep },
		getAncestor:function getAncestor(){ return Type.is(this.ancestor, Step) ? this.ancestor : this },
		getChildren:function getChildren(){ return this.children },
		getNumChildren:function getNumChildren(){ return this.children.length },
		getLength:function getLength(){ return this.getNumChildren() },
		//HIERARCHY REFLECT
		getHierarchies:function getHierarchies(){ return Step.hierarchies},
		getHierarchy:function getHierarchy(){ return Step.hierarchies[id] },
		
		// PLAY-TYPE (CHILDREN) CONTROLS
		getPlayhead:function getPlayhead(){ return this.playhead },
		getLooping:function getLooping(){ return this.looping },
		setLooping:function setLooping(value){ this.looping = value },
		getWay:function getWay(){ return this.way },
		setWay:function setWay(value){ this.way = value },
		getState:function getState(){ return this.state },
		setState:function setState(value){ this.state = value },
		
		getUserData:function getUserData(){ return this.userData },
		setUserData:function setUserData(value){ this.userData = value },
		
		getLoaded:function getLoaded(){ return this.loaded },
		setLoaded:function setLoaded(value){ this.loaded = value },
		getIsFinal:function getIsFinal(){ return this.isFinal },
		setIsFinal:function setIsFinal(value){ this.isFinal = value },
		
		hasChild:function hasChild(ref){
			if(Type.is(ref, Step))
				return this.getIndexOfChild(ref) != -1 ;
			else if (Type.of(ref, 'string'))
				return ref in this.alphachildren ;
			else
				return ref in this.children() ;
		},
		getChild:function getChild(ref){
			var st = this ;
			if(ref === undefined) ref = null ;
			var child ;
			if (ref == null)  // REF IS NOT DEFINED
				child = st.children[st.children.length - 1] ;
			else if (Type.is(ref, Step)) { // HERE REF IS A STEP OBJECT
				child = ref ;
				if (!st.hasChild(child)) throw new Error('step "'+child.id+'" is not a child of step "'+st.id+'"...') ;
			}else if (Type.of(ref, 'string')) { // is STRING ID
				child = st.alphachildren[ref]   ;
			}else { // is INT ID
				if(ref == -1) child = st.children[st.children.length - 1] ;
				else child = st.children[ref] ;
			}
			if (! Type.is(child, Step))  throw new Error('step "' + ref + '" was not found in step "' + st.id + '"...') ;
			
			return child ;
		},
		add:function add(child, childId){
			var st = this ;
			if(childId === undefined) childId = null ;
			var l = st.children.length ;
			
			if (!!childId) {
				child.id = childId ;
			}else {
				if(child.id === undefined) 
				child.id = l ;
				else {
					childId = child.id ;
				}
			}
			st.children[l] = child ; // write L numeric entry
			
			
			if (Type.of(childId, 'string')) { // write Name STRING Entry
				st.alphachildren[childId] = child ;
			}
			
			return st.register(child) ;
		},
		remove:function remove(ref){
			var st = this ;
			
			if(ref === undefined) ref = -1 ;
			var child = st.getChild(ref) ;
			var n = st.getIndexOfChild(child) ;
			
			if (Type.of(child.id, 'string')){
				st.alphachildren[child.id] = null ;
				delete st.alphachildren[child.id] ;
			}
			
			st.children.splice(n, 1) ;
			if (st.playhead == n) st.playhead -- ;
			
			return st.unregister(child) ;
		},
		empty:function empty(destroyChildren){
			if(destroyChildren === undefined) destroyChildren = true ;
			var l = this.getLength() ;
			while (l--) destroyChildren ? this.remove().destroy() : this.remove() ;
		},
		register:function register(child, cond){
			var st = this , ancestor;
			if(cond === undefined) cond = true ;
			
			if (cond) {
				child.index = st.children.length - 1 ;
				child.parentStep = st ;
				child.depth = st.depth + 1 ;
				ancestor = child.ancestor = st.getAncestor() ;
				child.path = (st.path !== undefined ? st.path : st.id ) + Step.SEPARATOR + child.id ;
				
				if (!!Step.hierarchies[ancestor.id]) {
					Step.hierarchies[ancestor.id][child.path] = child ;
				}
				
			}else {
				ancestor = child.ancestor ;
				
				if (!!Step.hierarchies[ancestor.id]) {
					Step.hierarchies[ancestor.id][child.path] = undefined ;
					delete Step.hierarchies[ancestor.id][child.path] ;
				}
				
				child.index = - 1 ;
				child.parentStep = undefined ;
				child.ancestor = undefined ;
				child.depth = 0 ;
				child.path = undefined ;
			}
			return child ;
		},
		unregister:function unregister(child){ return this.register.apply(this, [child, false]) },
		registerAsAncestor:function registerAsAncestor(cond){
			var st = this ;
			if (cond === undefined) cond = true ;
			if (cond) {
				Step.hierarchies[st.id] = { } ;
				st.ancestor = st ;
			}else {
				if (st.id in Step.hierarchies) {
					Step.hierarchies[st.id] = null ;
					delete Step.hierarchies[st.id] ;
				}
				st.ancestor = null ;
			}
			return st ;
		},
		unregisterAsAncestor:function unregisterAsAncestor(){ 
		   return this.registerAsAncestor(false) 
		},
		linkHierarchy:function linkHierarchy(h){
		   this.hierarchyLinked = true ;
		   this.hierarchy = h ;
		   return this ;
		},
		unlinkHierarchy:function unlinkHierarchy(h){
		   this.hierarchyLinked = false ;
		   this.hierarchy = undefined ;
		   delete this.hierarchy ;
		   return this ;
		},
		getIndexOfChild:function getIndexOfChild(child){
			return ArrayUtil.indexOf(this.children, child) ;
		},
		play:function play(ref){
			var st = this ;
			if(ref === undefined) ref = '$$playhead' ;
			var child ;
			if (ref == '$$playhead') {
				child = st.getChild(st.playhead) ;
			}else {
				child = st.getChild(ref) ;
			}
			
			var n = st.getIndexOfChild(child) ;
			
			st.way = (n < st.playhead) ? 'backward' : 'forward' ;
			
			if (n == st.playhead) {
				
				if(n == -1){ 
					trace('requested step "' + ref + '" is not child of parent... '+st.path) ;
				}else{
					trace('requested step "' + ref + '" is already opened... '+st.path) ;
				}
				
				return n ;
			}else {
				var curChild = st.children[st.playhead] ;
				
				if (!Type.is(curChild, Step)) {
					st.playhead = n ;
					child.open() ;
				}else {
					if (curChild.opened) {
						var step_close2 ;
						curChild.bind('step_close', step_close2 = function(e){
							e.target.unbind(e, step_close2) ;
							child.open() ;
							st.playhead = n ;
						}) ;
						curChild.close() ;
					}else {
						child.open() ;
						st.playhead = n ;
					}
				}
			}
			return n ;
		},
		kill:function kill(ref){
			var st = this ;
			if(ref === undefined) ref = '$$current' ;
			var child;
			if (st.playhead == -1) return st.playhead ;
			
			if (ref == '$$current') {
				child = st.getChild(st.playhead) ;
			}else {
				child = st.getChild(ref) ;
			}
			
			var n = st.getIndexOfChild(child) ;
			
			child.close() ;
			st.playhead = -1 ;
			return n ;
		},
		next:function next(){
			this.way = 'forward' ;
			if (this.hasNext()) return this.play(this.getNext()) ;
			else return -1 ;
		},
		prev:function prev(){
			this.way = 'backward' ;
			if (this.hasPrev()) return this.play(this.getPrev()) ;
			else return -1 ;
		},
		getNext:function getNext(){
			var s = this.children[this.playhead + 1] ;
			return this.looping ? Type.is(s, Step) ? s : this.children[0] : s ;
		},
		getPrev:function getPrev(){
			var s = this.children[this.playhead - 1] ;
			return this.looping? Type.is(s, Step) ? s : this.children[this.getLength() - 1] : s ;
		},
		hasNext:function hasNext(){ return this.getNext() ?  true : this.looping },
		hasPrev:function hasPrev(){ return this.getPrev() ?  true : this.looping },
		dumpChildren:function dumpChildren(str){
			if(!!!str) str = '' ;
			var chain = '                                                                            ' ;
			this.children.forEach(function(el, i, arr){
				str += chain.slice(0, el.depth) ;
				str += el ;
				if(parseInt(i+1) in arr) str += '\n' ;
			})
			return str ;
		},
		toString:function toString(){
			var st = this ;
			return '[Step >>> id:'+ st.id+' , path: '+st.path + ((st.children.length > 0) ? '[\n'+st.dumpChildren() +'\n]'+ ']' : ']') ;
		}
	}) ;
	
	var Unique = Type.define({
		pkg:'step',
		inherits:Step,
		domain:Type.appdomain,
		constructor:Unique = function Unique(){
			Unique.instance = this ;
			Unique.base.apply(this, ['@', new Command(this, function(){
				var c = this ; 
				var u = Unique.instance ; 
				
				return this ;
			})]) ;
		},
		statics:{
			instance:undefined,
			getInstance:function getInstance(){ return Unique.instance || new Unique() }
		},
		addressComplete:function addressComplete(e){
		   // trace('JSADDRESS redirection complete') ; // just for debug
		},
		toString:function toString(){
			var st = this ;
			return '[Unique >>> id:'+ st.id+' , path: '+ st.path + ((st.children.length > 0) ? '[\n'+ st.dumpChildren() + '\n]' + ']' : ']') ;
		}
	}) ;
	
	/* RESPONSE */
	var Response = Type.define({
		pkg:'response',
		inherits:Step,
		domain:Type.appdomain,
		constructor:Response = function Response(id, pattern, commandOpen, commandClose){
			
			var res = this ;
			var focus = function(e){
				if(e.type == 'focusIn'){
					AddressHierarchy.instance.changer.setTitle(this.path) ;
				}else{
					// AddressChanger.setTitle(this.parentStep.path) ;
					// we don't want title to switch all the time, just when openig a step
				}
			} ;
			
			Response.base.apply(this, [
				id, 
				commandOpen || new Command(res, function resCommandOpen(){
					// trace('opening "'+ res.path+ '"') ;
					var c = this ;
					
					// res.bind('focusIn', focus) ;
					// res.bind('focusOut', focus) ;
					
					if(!!res.responseAct) {
						
						var rr = res.responseAct(res.id, res) ;
						if(!!rr){
							return rr ;
						}
					}
					
					return c ;
				}),
				commandClose || new Command(res, function resCommandClose(){
					// trace('closing "'+ res.path+ '"') ;
					var c = this ;
					
					
					if(!!res.responseAct) {
						var rr = res.responseAct(res.id, res) ;
						if(!!rr){
							
							return rr ;
						}
					}
					
					// res.unbind('focusIn', focus) ;
					// res.unbind('focusOut', focus) ;
					
					return c ;
				})
			]) ;
			
			// Cast regexp Steps
			if(pattern !== '/' && PathUtil.allslash(pattern)){
				res.regexp = new RegExp(PathUtil.trimall(pattern)) ;
			}
			return res ;
		},
		ready:function ready(){
			var st = this ;
			setTimeout(function(){
				(st.opening ? st.commandOpen : st.commandClose).dispatchComplete() ;
			}, 1) ;
			return this ;
		},
		focusReady:function focusReady(){ this.dispatchCleared() ; return this ;},
		fetch:function(url, params){
			// return new Mongo(url).load(undefined, false).render(params) ;
			return params ;
		},
		render:function(url, params){
			var res = this ;
			
			var t = new Jade(url).load(undefined, false).render(params) ;
			res.template = $(t).children() ;
			
			return res.template ;
		},
		send:function(str, params){
			var res = this ;
			
			var t = new Jade().render(params, str) ;
			res.template = $(t).children() ;
			
			return res.template ;
			
		},
		isLiveStep:function(){
			var res = this ;
			// alert(res.regexp)
			if( !! res.regexp){
				if(/[^\w]/.test(res.regexp.source))
				return true ;
			}
			return false ;
		}
	}) ;
	
	/* MAIN StrawExpress TOOLKIT */
	var Express = Type.define({
		pkg:'::Express',
		domain:Type.appdomain,
		statics:{
			app:undefined,
			disp:new EventDispatcher(window),
			initialize:function(){
				Express.app = new Express() ;
			}
		},
		settings:{
			'x-powered-by': true,
			'env': 'development',
			'views': undefined,
			'jsonp callback name': 'callback',
			'json spaces': 2
		},
		destroy:function destroy(){
			if (!!Unique.instance) Unique.instance = Unique.getInstance().destroy() ;
		},
		constructor:Express = function Express(win){
			return !!Express.app ? Express.app : this ;
		},
		Qexists : function Qexists(sel, sel2) {
			if(!!sel2) sel = $(sel).find(sel2) ;
			sel = Type.is(sel, $) ? sel : $(sel) ;
			var s = new Boolean(sel.length) ;
			s.target = sel ;
			return (s.valueOf()) ? s.target : undefined ;
		},
		listen:function listen(type, closure){
			Express.disp.bind(type, closure) ;
			return this ;
		},
		discard:function discard(type, closure){
			Express.disp.unbind(type, closure) ;
			return this ;
		},
		configure:function configure(env, fn){
			var envs = 'all', args = ArrayUtil.argsToArray(arguments);
			fn = args.pop() ;
			if (args.length) envs = args ;
			if ('all' == envs || envs.indexOf(this.settings.env))
				fn.call(this) ;
			return this ;
		},
		use:function use(route, fn){
			var app, home, handle ;
			// default route to '/' 
			if (!Type.of(route, 'string')) 
				fn = route, route = '/' ;
			// express app
			if (!!fn.handle && !!fn.set) app = fn ;
			// restore .app property on req and res
			if (!!app) {
				// app.route = route ;
				// fn = function(req, res, next) {
					// var orig = req.app ;
					// app.handle(req, res, function(err){
						// req.app = res.app = orig ;
						// req.__proto__ = orig.request ;
						// res.__proto__ = orig.response ;
						// next(err) ;
					// });
				// };
			}
			// connect.proto.use.call(this, route, fn) ;
			// mounted an app
			if (!!app) {
				// app.parent = this ;
				// app.emit('mount', this) ;
			}
			return this ;
		},
		address:function address(params){
			return this ;
		},
		isReady:function(){
			return AddressHierarchy.isReady();
		},
		createClient:function createClient(){
			AddressHierarchy.setup(Express.app.get('address')) ;
			AddressHierarchy.create(Express.app.get('unique')) ;
			return this ;
		},
		initJSAddress:function initJSAddress(){
			Express.app.get('unique').getInstance().commandOpen.dispatchComplete() ;
			return this ;
		},
		get:function get(pattern, handler, parent){
			
			if(arguments.length == 1){ // is a getter of settings
				return this.set(pattern) ;
			}
			
			if(handler.constructor !== Function){
				for(var s in handler)
					this.get(s == 'index' ? '/' : s , handler[s], parent) ;
				return this ;
			}
			
			var id = pattern.replace(/(^\/|\/$)/g, '') ;
			
			var res = new Response(id, pattern) ;
			res.parent = !!parent ? (id == '' ? parent.parentStep : parent) : res.path == '/' ? undefined : Express.app.get('unique').getInstance() ;
			res.name = id == '' ? !!res.parent ? res.parent.id : Express.app.get('unique').getInstance().id : res.id ;
			
			res.handler = handler ;
			res.responseAct = handler ;
			
			this.enableResponse(true, res, parent) ;
			
			return this ;
		},
		set: function set(setting, val){
			if (1 == arguments.length) {
				if (this.settings.hasOwnProperty(setting)) {
					return this.settings[setting] ;
				} else if(!!this.parent) {
					return this.parent.set(setting) ;
				}
			} else {
				this.settings[setting] = val ;
				return this;
			}
		},
		enableResponse:function enableResponse(cond, res, parent){
			var handler = res.handler ;
			
			if(cond){
				
				parent = parent || AddressHierarchy.hierarchy.currentStep ;
				
				if(res.id == '') parent.defaultStep = res ;
				parent.add(res) ;
				
				for(var s in handler){
					if(s.indexOf('@') == 0) this.attachHandler(true, s, handler[s], res) ;
					else if(s == 'index') this.get('', handler[s], res) ;
					else this.get(s, handler[s], res) ;
				}
				
			}else{
				for(var s in handler){
					if(s.indexOf('@') == 0) this.attachHandler(false, s, handler[s], res) ;
				}
				var l = res.getLength() ;
				while(l--){
					this.enableResponse(false, res.getChild(l)) ;
				}
				res.parentStep.remove(res) ;
			}
		},
		removeResponse:function removeResponse(res){
			return this.enableResponse(false, res) ;
		},
		attachHandler:function attachHandler(cond, type, handler, res){
			type = type.replace('@', '') ;
			var bindmethod = cond ? 'bind' : 'unbind' ;
			switch(type){
				case 'focusOut' :
					res[bindmethod](type+'Out', handler) ;
				break ;
				case 'focusIn' :
					res[bindmethod](type+'In', handler) ;
				break ;
				case 'focus' :
					res[bindmethod](type+'In', handler) ;
					res[bindmethod](type+'Out', handler) ;
				break ;
				case 'toggleIn' :
					res[bindmethod]('step_opening', handler) ;
				break ;
				case 'toggleOut' :
					res[bindmethod]('step_closing', handler) ;
				break ;
				case 'toggle' :
					res[bindmethod]('step_opening', handler) ;
					res[bindmethod]('step_closing', handler) ;
				break ;
				default :
					res[bindmethod](type, handler) ;
				break ;
			}
			
		}
	}) ;
	
})) ;