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

require('jquery-1.8.1.min.js') ;
require('jquery.ba-hashchange.min.js') ;

module.exports = Pkg.write('org.libspark.straw', function(){

	/* UTILS */
	var CodeUtil = Type.define({
		pkg:'utils::CodeUtil',
		domain:Type.appdomain,
		statics:{
			overwritesafe:function overwritesafe(target, propname, propvalue){
				if(target[propname] === undefined || target[propname] === null)
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
				return obj instanceof Array ;
			},
			slice:[].slice,
			argsToArray:function(args){
				return ArrayUtil.slice.call(args) ;
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
	var Request = Type.define({
		pkg:'net',
		domain:Type.appdomain,
		statics:{
			namespaces:[
				function () {return new XMLHttpRequest()},
				function () {return new ActiveXObject("Msxml2.XMLHTTP")},
				function () {return new ActiveXObject("Msxml3.XMLHTTP")},
				function () {return new ActiveXObject("Microsoft.XMLHTTP")}
			],
			generateXHR:function() {
				var xhttp = false ;
				var bank = Request.namespaces ;
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
		constructor:Request = function Request(url, complete, postData) {
			var r = Request.generateXHR();    
			if (!r) return;
			this.request = r ;
			this.url = url ;
			this.complete = complete ;
			this.userData = {
				post_data:postData,
				post_method:postData ? "POST" : "GET",
				ua_header:{ua:'User-Agent',ns:'XMLHTTP/1.0'},
				post_data_header: postData !== undefined ? {content_type:'Content-type',ns:'application/x-www-form-urlencoded'} : undefined 
			} ;
		},
		load:function(url){
			var r = this.request ;
			var th = this ;
			var ud = this.userData ;
			var complete = this.complete ;
			r.open(ud['post_method'] , url || this.url, true) ;
			if (ud['post_data_header'] !== undefined) r.setRequestHeader(ud['post_data_header']['content_type'],ud['post_data_header']['ns']) ;
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
			for(var s in this){
				delete this[s] ;
			}
			return undefined ;
		}
	}) ;
	
	/* EVENTS */
	var IEvent = Type.define({
		pkg:'event',
		inherits:jQuery.Event,
		domain:Type.appdomain,
		constructor:IEvent = function IEvent(type, data){
			IEvent.base.apply(this, ArrayUtil.argsToArray(arguments)) ;
			return this ;
		}
	}) ;
	var EventDispatcher = Type.define({
		pkg:'event',
		domain:Type.appdomain,
		constructor:EventDispatcher = function EventDispatcher(el){
			this.setDispatcher(el || this) ;
		},
		setDispatcher:function(el) // @return void
		{
			this.dispatcher = $(el) ;
			this.originaltarget = (typeof(el) == 'string') ? this.dispatcher[0] : el ;
		},
		hasEL:function(type) // @return Boolean
		{
			var dataEvents = this.dispatcher.data('events') ;
			// trace(this.dispatcher)
			if(dataEvents !== undefined) {
				
				trace(dataEvents)
				return type in dataEvents ;
			}
			return false ;
		},
		willTrigger:function(type) // @return Boolean
		{
			var dataEvents = this.dispatcher.data('events') ;
			if(dataEvents !== undefined) {
				return type in dataEvents ;
			}
			return false ;
		},
		dispatch:function(e) // @return void
		{
			if(this.dispatcher !== undefined){
				this.dispatcher.trigger(e) ;
			}
		},
		addEL:function(type, closure) // @return Boolean
		{
			if(closure === undefined) throw new ArgumentError('event handler type "'+type+'"to detach is not defined') ;
			if(this.dispatcher !== undefined){
				this.dispatcher.bind(type, closure) ;
			}
			return this ;
		},
		bind:function(type, closure){
			return this.addEL(type, closure) ;
		},
		removeEL:function(type, closure) // @return Boolean
		{
			if(closure === undefined) throw new ArgumentError('event handler type "'+type+'"to detach is not defined') ;
			if(this.dispatcher !== undefined)
			this.dispatcher.unbind(type, closure) ;
			return this ;
		},
		unbind:function(type, closure){
			return this.removeEL(type, closure) ;
		},
		copyFrom:function(source)
		{
			if(!source instanceof EventDispatcher) {
				trace('wrong input for EventDispatcher CopyFrom...');
				return ;
			}
			if(source.dispatcher !== undefined) this.setDispatcher(source.originaltarget) ;
			var listeners = source.dispatcher.data('events') ;
			if(listeners !== undefined){
				for (var type in listeners) {
					var list = listeners[type] ;
					var l = list.length;
					for (var i = 0; i < l; ++i) {
						var data = list[i] ;
						this.addEL(type, data.listener);
					}
				}
			}
			return this ;
		}
	}) ;
	
	/* COMMANDS */
	var Command = Type.define({
		pkg:'command',
		inherits:EventDispatcher,
		domain:Type.appdomain,
		constructor:Command = function Command(thisObj, closure, params) {
			Command.base.call(this) ;
			// this.setDispatcher(this) ;

			var args = ArrayUtil.argsToArray(arguments) ;
			this.context = args.shift() ;
			this.closure = args.shift() ;
			this.params = args ;
			this.depth = '$' ;

			return this ;
		},
		execute : function(){
			var r = this.closure.apply(this, [].concat(this.params)) ;
			if(r !== null && r !== undefined) {
			if(r !== this) this.setDispatcher(this) ;
			return this ;
			}
		},
		cancel:function(){ // @return Command
			trace('cancelling') ;
			return this.destroy() ;
		},
		dispatchComplete : function(){
			this.dispatch(this.depth) ;
		},
		destroy : function(){
			
			for(var s in this){
				delete this[s] ;
			}

			return undefined ;
		}
	}) ;
	var CommandQueue = Type.define({
		pkg:'command',
		inherits:Command,
		domain:Type.appdomain,
		constructor : function CommandQueue() {

			// CommandQueue.base.call(this) ;
			Command.base.call(this) ;

			this.commands = ArrayUtil.argsToArray(arguments) ;
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
						var isCommand = arg instanceof Command ;
						if(isCommand) cq.commands[cq.commands.length] = arg ;
						else // must be an array of commands
							if(0 in arg) add.apply(null, arg) ;
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
			if(this.commands !== undefined){
				var commands = this.commands ;
				var l = commands.length ;
				while (l--) {
					var comm = commands[l];
					if(comm instanceof CommandQueue) comm.commandIndex = -1 ;
				}
			}
			this.commandIndex = -1 ;
			return this ;
		},
		cancel:function(){ // @return Command
			return this.destroy() ;
		},
		next : function(){
			var cq = this ;
			var ind = this.commandIndex ;
			ind ++ ;
			
			var c = this.commands[ind] ;
			if(c === undefined){
				trace('commandQueue did not found command and will return, since command stack is empty...') ;
				setTimeout(function(){cq.dispatchComplete()}, 0) ; 
				return this ;
			}

			c.depth = this.depth + '$' ;

			var r = c.execute() ;

			if(r === undefined || r === null){
				this.commandIndex = ind ;
			if(ind == this.commands.length - 1){
				this.dispatchComplete() ;
			}else{
				this.next() ;
			}
			}else{
				var type = c.depth ;
				var rrr ;
				r.addEL(type, rrr = function(){
					r.removeEL(type, rrr) ;
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

			if(this.commands !== undefined){
				var commands = this.commands ;
				var l = commands.length ;
				while (l--) 
					commands.pop().destroy() ;
			}

			for(var s in this){
				delete this[s] ;
			}

			return undefined ;
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

			if(w.initclosure !== undefined) {
				var co = new Command(w, w.initclosure) ;
				var o = co.execute() ;
				var rrr ;
				if(o !== undefined){
					co.addEL('$', rrr = function(e){
						co.removeEL('$', rrr) ;
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
				this.uid = -1 ;
			}
			
			for(var s in this){
				delete this[s] ;
			}
			
			return undefined ;
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
			if(w.request !== undefined) if(w.success !== undefined) return w.success.apply(w, [w.jxhr, w.request]) ;
			w.request = new Request(w.url, function(jxhr, r){
				w.jxhr = jxhr ;
				if(w.success !== undefined)w.success.apply(w, [jxhr, r]) ;
			}, w.postData) ;

			if(w.initclosure !== undefined) w.initclosure.apply(w, [w.request]) ;
			if(w.toCancel !== undefined) {
				setTimeout(function(){
					w.dispatchComplete() ;
				}, 10) ;
				return w;
			}
			setTimeout(function(){w.request.load()}, 0) ;
			
			return this ;
		},
		destroy : function(){
			if(this.request) this.request.destroy() ;
			
			for(var s in this){
				delete this[s] ;
			}
			
			return undefined ;
		}
	}, Command) ;

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
			this.alphachildren = [] ;
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
			
			c.addEL('$', $complete = function(e){
				c.removeEL('$', $complete) ;
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
					if(!o instanceof EventDispatcher) throw new Error('supposed-to-be eventDispatcher is not one...', o) ;
					var rrr ;
					o.addEL(st.commandOpen.depth, rrr = function(e){

						o.removeEL(st.commandOpen.depth, rrr) ;
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
					 if(!o instanceof EventDispatcher) throw new Error('supposed-to-be eventDispatcher is not one...', o) ;
					 var rrr ;
					 o.addEL(st.commandClose.depth, rrr = function(e){
						e.target.removeEL(st.commandClose.depth, rrr) ;
						st.checkCloseNDispatch() ;
					 }) ;
				}else st.checkCloseNDispatch() ;
			}else st.checkCloseNDispatch() ;
		},
		checkOpenNDispatch:function(){ this.opened = true ; this.opening = false ; this.dispatchOpen() }, 
		checkCloseNDispatch:function(){ this.opened = false ; this.closing = false ; this.dispatchClose() },
		dispatchOpening:function(){ this.dispatch('step_opening') },
		dispatchOpen:function(){ this.dispatch('step_open') },
		dispatchClosing:function(){ this.dispatch('step_closing') },
		dispatchClose:function(){ this.dispatch('step_close') },
		dispatchOpenComplete:function(){ this.dispatch(this.commandOpen.depth) },
		dispatchCloseComplete:function(){ this.dispatch(this.commandClose.depth) },
		dispatchFocusIn:function(){ this.dispatch('focusIn') },
		dispatchFocusOut:function(){ this.dispatch('focusOut') },
		// dispatchClearedIn:function(){ this.dispatch('focusClearedIn') },
		// dispatchClearedOut:function(){ this.dispatch('focusClearedOut') },
		
		// DATA DESTROY HANDLING
		destroy:function(){
			var st = this ;
			if (st.parentStep instanceof Step && st.parentStep.hasChild(st)) st.parentStep.remove(st) ;
			
			if (st.isOpenable) st.commandOpen = st.destroyCommand(st.commandOpen) ;
			if (st.isCloseable) st.commandClose = st.destroyCommand(st.commandClose) ;
			
			if (st.userData !== undefined) st.userData = st.destroyObj(st.userData) ;
			
			if (st.children.length != 0) st.children = st.destroyChildren() ;
			if (st.ancestor instanceof Step && st.ancestor == st) {
				if (st.id in Step.hierarchies) st.unregisterAsAncestor() ;
			}
			
			for(var s in this){
				delete this[s] ;
			}
			
			return undefined ;
		},
		destroyCommand:function(c){ return c !== undefined ? c.destroy() : c },
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
		isOpenable:function isOpenable(){ return this.commandOpen instanceof Command},
		isCloseable:function isCloseable(){ return this.commandClose instanceof Command},
		getCommandOpen:function getCommandOpen(){ return this.commandOpen },
		setCommandOpen:function setCommandOpen(value){ this.commandOpen = value },
		getCommandClose:function getCommandClose(){ return this.commandClose },
		setCommandClose:function setCommandClose(value){ this.commandClose = value },
		getOpening:function getOpening(){ return this.opening },
		getClosing:function getClosing(){ return this.closing },
		getOpened:function getOpened(){ return this.opened },
		// CHILD/PARENT REFLECT
		getParentStep:function getParentStep(){ return this.parentStep },
		getAncestor:function getAncestor(){ return (this.ancestor instanceof Step)? this.ancestor : this },
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
			if(ref instanceof Step)
				return this.getIndexOfChild(ref) != -1 ;
			else if (typeof(ref) === 'string')
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
			else if (ref instanceof Step) { // HERE REF IS A STEP OBJECT
				child = ref ;
				if (!st.hasChild(child)) throw new Error('step "'+child.id+'" is not a child of step "'+st.id+'"...') ;
			}else if (typeof(ref) === 'string') { // is STRING ID
				child = st.alphachildren[ref]   ;
			}else { // is INT ID
				if(ref == -1) child = st.children[st.children.length - 1] ;
				else child = st.children[ref] ;
			}
			if (! child instanceof Step)  throw new Error('step "' + ref + '" was not found in step "' + st.id + '"...') ;
			
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
			
			
			if (typeof(childId) === 'string') { // write Name STRING Entry
				st.alphachildren[childId] = child ;
			}
			
			return st.register(child) ;
		},
		remove:function remove(ref){
			var st = this ;
			
			if(ref === undefined) ref = -1 ;
			var child = st.getChild(ref) ;
			var n = st.getIndexOfChild(child) ;
			
			if (typeof(child.id) === 'string'){
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
				
				// if(child.label !== undefined) child.labelPath = (st.labelPath !== undefined ? st.labelPath : st.path ) + Step.SEPARATOR + child.label ;
				
				if (Step.hierarchies[ancestor.id] !== undefined) {
					Step.hierarchies[ancestor.id][child.path] = child ;
					// if(child.label !== undefined) Step.hierarchies[ancestor.id][child.labelPath] = child ;
				}
				
			}else {
				ancestor = child.ancestor ;
				
				
				if (Step.hierarchies[ancestor.id] !== undefined) {
					Step.hierarchies[ancestor.id][child.path] = undefined ;
					delete Step.hierarchies[ancestor.id][child.path] ;
					// if(child.label !== undefined) {
						// Step.hierarchies[ancestor.id][child.labelPath] = undefined ;
						// delete Step.hierarchies[ancestor.id][child.labelPath] ;
					// }
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
				
				if (!(curChild instanceof Step)) {
					st.playhead = n ;
					child.open() ;
				}else {
					if (curChild.opened) {
						var step_close2 ;
						curChild.addEL('step_close', step_close2 = function(e){
							e.target.removeEL(e, step_close2) ;
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
			return this.looping ? s instanceof Step ? s : this.children[0] : s ;
		},
		getPrev:function getPrev(){
			var s = this.children[this.playhead - 1] ;
			return this.looping? s instanceof Step ? s : this.children[this.getLength() - 1] : s ;
		},
		hasNext:function hasNext(){ return this.getNext() ?  true : this.looping },
		hasPrev:function hasPrev(){ return this.getPrev() ?  true : this.looping },
		dumpChildren:function dumpChildren(str){
			if(str === undefined) str = '' ;
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
			Unique.base.apply(this, ['@', new Command(this, this.onSite)]) ;
		},
		statics:{
			instance:undefined,
			getInstance:function getInstance(){ return Unique.instance || new Unique() }
		},
		onSite:function onSite(){
			// I don't see something to put here, but perhaps later we'll find out
			return this ;
		},
		addressComplete:function addressComplete(e){
		   trace('command complete') ; // just for debug
		},
		toString:function toString(){
			var st = this ;
			return '[Unique >>> id:'+ st.id+' , path: '+ st.path + ((st.children.length > 0) ? '[\n'+ st.dumpChildren() + '\n]' + ']' : ']') ;
		}
	}) ;
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
				commandOpen || new Command(res, function(){
					trace('opening "'+ res.path+ '"') ;
					var c = this ;
					
					
					res.bind('focusIn', focus).bind('focusOut', focus)
					
					if(!!res.responseAct) {
						
						var rr = res.responseAct(res.id, res) ;
						if(!!rr){
							return rr ;
						}
					}
					return c ;
				}),
				commandClose || new Command(res, function(){
					trace('closing "'+ res.path+ '"') ;
					var c = this ;
					
					if(!!res.responseAct) {
						var rr = res.responseAct(res.id, res) ;
						if(!!rr){
							
							return rr ;
						}
					}
					
					res.unbind('focusIn', focus).unbind('focusOut', focus)
					
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
			
		}
	}) ;
	
	// PROXY
	var Proxy = Type.define(function(){
		var ns = {}, __global__ = window, returnValue = function(val, name){return val },
		toStringReg = /^\[|object ?|class ?|\]$/g ,
		DOMClass = function (obj) {
		
			if(obj.constructor !== undefined && obj.constructor.prototype !== undefined) return obj.constructor ;
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
			
			if(trans[tname] !== undefined) kl = (tname == 'Window') ? trans[tname] : 'HTML' + trans[tname] + 'Element' ;
			else kl = tname.replace(/^(.)(.+)$/, '$1'.toUpperCase() + '$2'.toLowerCase()) ;
			if(__global__[kl] === undefined) { 
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
						if(o !== undefined ){
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
				if(ns[cl] !== undefined && tobecached === true) {
					ret = ns[cl] ;
					return (toClass) ? ret : new ret(target) ;
				}
				
				var tg = target.constructor === Function ? target : target.constructor ;
				
				var name ;
				if(!!!tg) name = cl ;
				else name = tg == Object ? '' : (tg.name || getctorname(tg.toString())) ;
				
				
				var tar, over ;	
				if(tar === undefined) { tar = target ; over = override}
				else if (tar !== target) {over = tar ; tar = target}
				else if(!!!over){over = override}
				
				if(!!!over) {
					over = {constructor:Function('return (function '+cl+'Proxy(){}) ;')()} ;
				}
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
			Express.app.get('unique').instance = Express.app.get('unique').getInstance().destroy() ;
		},
		constructor:Express = function Express(win){
			return !!Express.app ? Express.app : this ;
		},
		Qexists : function Qexists(sel, sel2) {
			if(sel2 !== undefined) sel = $(sel).find(sel2) ;
			sel = sel instanceof $ ? sel : $(sel) ;
			var s = new Boolean(sel.length > 0) ;
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
			if ('string' != typeof route) 
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
			
			if(arguments.length == 1){ // is a getter
				return this.set(pattern) ;
			}
			
			if(handler.constructor !== Function){
				for(var s in handler)
					this.get(s == 'index' ? '/' : s , handler[s], parent) ;
				return this ;
			}
			
			var sc = this ;
			var id = pattern.replace(/(^\/|\/$)/g, '') ;
			
			var res = new Response(id, pattern) ;
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
				var l = res.getLength();
				while(l--){
						// trace(res.getChild(l))
						this.enableResponse(false, res.getChild(l), res) ;
					}
				res.parentStep.remove(res) ;
			
				
			}
			
		},
		attachHandler:function(cond, type, handler, res){
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
	
	return [Express] ;
	
})