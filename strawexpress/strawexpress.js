/*
* StrawExpress v 1.0.0
* 
* Base Framework For DeepLinking along with StrawNode
* author saz
* 
* licensed under GNU GPL-General Public License
* copyright sazaam[(at)gmail.com]
* 2011-2013
* 
* */

'use strict' ;

require('jquery-1.8.0.min.js') ;
require('jquery.ba-hashchange.min.js') ;

module.exports = Pkg.write('org.libspark.straw', function(){
	
	
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
			ud[n] = undefined ;
			delete ud[n] ;
			}

			this.userData =
			this.url =
			this.request =

			undefined ;

			delete this.userData ;
			delete this.url ;
			delete this.request ;

			return undefined ;
		}
	}) ;

	/* EVENTS */
	var IEvent = Type.define({
		pkg:'event',
		inherits:jQuery.Event,
		domain:Type.appdomain,
		constructor:IEvent = function IEvent(type, data){
			IEvent.base.apply(this, [].slice.call(arguments)) ;
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
			if(dataEvents !== undefined) {
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
			this.setDispatcher(this) ;

			var args = [].slice.call(arguments) ;
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
			this.params =
			this.context =
			this.closure =
			this.depth =
			this.dispatcher =

			undefined ;

			delete this.params ;
			delete this.context ;
			delete this.closure ;
			delete this.depth ;
			delete this.dispatcher ;

			return undefined ;
		}
	}) ;
	var CommandQueue = Type.define({
		pkg:'command',
		inherits:Command,
		domain:Type.appdomain,
		constructor : function CommandQueue() {

			CommandQueue.base.call(this) ;


			this.commands = [] ;
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

			if(arguments.length > 0 ) this.add(arguments[0]) ;

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
				r.addEL(type, function rrr(){
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
				this.commands = this.commandIndex = undefined ;
				delete this.commands ;
				delete this.commandIndex ;
			}

			this.next =
			this.add =
			this.dispatcher =
			this.depth =
			undefined ;

			delete this.next ;
			delete this.add ;
			delete this.dispatcher ;
			delete this.depth ;

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
				if(o !== undefined){
					co.addEL('$', function rrr(e){
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
			this.uid =
			this.time =
			this.depth =
			undefined ;
			delete this.uid ;
			delete this.time ;
			delete this.depth ;
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
			
			this.initclosure =
			this.toCancel =
			this.request =
			this.success =
			this.jxhr =
			this.url =
			this.postData =
			this.depth =
			this.dispatcher =
			
			undefined ;
			
			delete this.initclosure ;
			delete this.toCancel ;
			delete this.request ;
			delete this.success ;
			delete this.jxhr ;
			delete this.url ;
			delete this.postData ;
			delete this.depth ;
			delete this.dispatcher ;
			
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
			SEPARATOR:'/',
			STATE_OPENED:"opened",
			STATE_CLOSED:"closed"
		},
		commandOpen:undefined,
		commandClose:undefined,
		id:'',
		path:'',
		depth:NaN,
		index:NaN,
		parentStep:undefined,
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
			Step.base.apply(this, [this]) ;
			this.id = id ;
			this.commandOpen = commandOpen ;
			this.commandClose = commandClose ;
			this.children = [] ;
			this.alphachildren = [] ;
			this.depth = 0 ;
			this.index = -1 ;
			this.playhead = -1 ;
			this.userData = { } ;
			this.isFinal = false ;
		},
		reload:function(){
			var st = this ;
			var c = st.commandClose ;
			
			
			c.addEL('$', function $complete(e){
				c.removeEL('$', $complete) ;
				
				
				s.open() ;
				
			}) ;
			
			
			st.close() ;
		},
		// STEP FUNCTIONNAL
		//  OPEN, CLOSE
		//  CHECKINGS AND DISPATCHES
		open:function()
		{
			var st = this ;
			
			if( st.opened && !st.closing) throw new Error('currently trying to open an already-opened step ' + st.path + ' ...')
			st.opening = true ;
			
			if (st.isOpenable()) {
				var o = st.commandOpen.execute() ;
				
				if (!!o){
					if(!o instanceof EventDispatcher) throw new Error('supposed-to-be eventDispatcher is not one...', o) ;
					
					o.addEL(st.commandOpen.depth, function commandopen2(e){

						o.removeEL(st.commandOpen.depth, commandopen2) ;
						st.checkOpenNDispatch() ;
						
					}) ;
				}else st.checkOpenNDispatch() ;
			}else st.checkOpenNDispatch() ;
		},
		close:function()
		{
			var st = this ;
			if ( !st.opened && !st.opening) throw new Error('currently trying to close a non-opened step ' + st.path + ' ...')
			st.closing = true ;
			
			if (st.isCloseable()) {
				var o = st.commandClose.execute() ;
				if (!!o) {
					 if(!o instanceof EventDispatcher) throw new Error('supposed-to-be eventDispatcher is not one...', o) ;
					 o.addEL(st.commandClose.depth, function rrr(e){
						e.target.removeEL(st.commandClose.depth, rrr) ;
						st.checkCloseNDispatch() ;
					 }) ;
				}else st.checkCloseNDispatch() ;
			}else st.checkCloseNDispatch() ;
		},
		checkOpenNDispatch:function(){ this.opened = true ; this.opening = false ; this.dispatchOpen() }, 
		checkCloseNDispatch:function(){ this.opened = false ; this.closing = false ; this.dispatchClose() },
		dispatchOpen:function(){ this.dispatch('step_open') },
		dispatchClose:function(){ this.dispatch('step_close') },
		dispatchOpenComplete:function(){ this.dispatch(this.commandOpen.depth) },
		dispatchCloseComplete:function(){ this.dispatch(this.commandClose.depth) },
		dispatchFocusIn:function(){ if(this.hasEL('focusIn')) this.dispatch('focusIn') },
		dispatchFocusOut:function(){ if(this.hasEL('focusOut')) this.dispatch('focusOut') },
		dispatchClearedIn:function(){ if(this.hasEL('focusClearedIn')) this.dispatch('focusClearedIn') },
		dispatchClearedOut:function(){ if(this.hasEL('focusClearedOut')) this.dispatch('focusClearedOut') },
		
		// DATA DESTROY HANDLING
			
		destroy:function()
		{
			var st = this ;
			if (st.parentStep instanceof Step && st.parentStep.hasChild(st)) st.parentStep.remove(st) ;
			
			if (st.isOpenable) st.commandOpen = st.destroyCommand(st.commandOpen) ;
			if (st.isCloseable) st.commandClose = st.destroyCommand(st.commandClose) ;
			
			if (st.userData !== undefined) st.userData = st.destroyObj(st.userData) ;
			
			if (st.children.length != 0) st.children = st.destroyChildren() ;
			if (st.ancestor instanceof Step && st.ancestor == st) {
				if (st.id in Step.hierarchies) st.unregisterAsAncestor() ;
			}
			
			st.id = undefined ;
			st.parentStep = undefined ;
			st.ancestor = undefined ;
			st.depth = 0 ;
			st.index = -1 ;
			st.path = undefined ;
			
			return null ;
		},
		destroyCommand:function(c){ return c !== undefined ? c.destroy() : c },
		destroyChildren:function(){ if (this.getLength() > 0) this.empty(true) ; return undefined },
		destroyObj:function(o)
		{
			for (var s in o) {
				o[s] = undefined ;
				delete o[s] ;
			}
			return undefined ;
		},
		
		setId:function(value){ this.id = value },
		getId:function(){ return this.id},
		getIndex:function(){ return this.index},
		getPath:function(){ return this.path },
		getDepth:function(){ return this.depth },
		// OPEN/CLOSE-TYPE (SELF) CONTROLS
		isOpenable:function(){ return this.commandOpen instanceof Command},
		isCloseable:function(){ return this.commandClose instanceof Command},
		getCommandOpen:function(){ return this.commandOpen },
		setCommandOpen:function(value){ this.commandOpen = value },
		getCommandClose:function(){ return this.commandClose },
		setCommandClose:function(value){ this.commandClose = value },
		getOpening:function(){ return this.opening },
		getClosing:function(){ return this.closing },
		getOpened:function(){ return this.opened },
		// CHILD/PARENT REFLECT
		getParentStep:function(){ return this.parentStep },
		getAncestor:function(){ return (this.ancestor instanceof Step)? this.ancestor : this },
		getChildren:function(){ return this.children },
		getNumChildren:function(){ return this.children.length },
		getLength:function(){ return this.getNumChildren() },
		//HIERARCHY REFLECT
		getHierarchies:function(){ return Step.hierarchies},
		getHierarchy:function(){ return Step.hierarchies[id] },
		
		// PLAY-TYPE (CHILDREN) CONTROLS
		getPlayhead:function(){ return this.playhead },
		getLooping:function(){ return this.looping },
		setLooping:function(value){ this.looping = value },
		getWay:function(){ return this.way },
		setWay:function(value){ this.way = value },
		getState:function(){ return this.state },
		setState:function(value){ this.state = value },
		// USER DATA
		getUserData:function(){ return this.userData },
		setUserData:function(value){ this.userData = value },
		
		getLoaded:function(){ return this.loaded },
		setLoaded:function(value){ this.loaded = value },
		getIsFinal:function(){ return this.isFinal },
		setIsFinal:function(value){ this.isFinal = value },
		
		// CHILDREN HANDLING
		//  GETCHILD
		//  HASCHILD
		//  ADD, REMOVE
		//  EMPTY
		
		hasChild:function(ref){
			if(ref instanceof Step)
			return this.children.indexOf(ref) != -1 ;
			else if (typeof(ref) === 'string') return ref in this.alphachildren ;
			else return ref in this.children() ;
		},
		getChild:function(ref) // returns Step
		{
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
		add:function(child, childId) // returns Step
		{
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
		remove:function(ref) // returns Step
		{
			var st = this ;
			if(ref === undefined) ref = -1 ;
			var child = st.getChild(ref) ;
			var n = st.children.indexOf(child) ;
			if (typeof(child.id) === 'string'){
				st.alphachildren[child.id] = null ;
				delete st.alphachildren[child.id] ;
			}
			
			st.children.splice(n, 1) ;
			if (st.playhead == n) st.playhead -- ;
			
			return st.unregister(child) ;
		},
		empty:function(destroyChildren) // returns void
		{
			if(destroyChildren === undefined) destroyChildren = true ;
			var l = this.getLength() ;
			while (l--) destroyChildren ? this.remove().destroy() : this.remove() ;
		},
		
		// REGISTRATION HANDLING + ANCESTOR GENEALOGY
		register:function(child, cond) // returns Step
		{
			var st = this , ancestor;
			if(cond === undefined) cond = true ;
			
			if (cond) {
				child.index = st.children.length - 1 ;
				child.parentStep = st ;
				child.depth = st.depth + 1 ;
				ancestor = child.ancestor = st.getAncestor() ;
				child.path = (st.path !== undefined ? st.path : st.id ) + Step.SEPARATOR + child.id ;
				
				if(child.label !== undefined) child.labelPath = (st.labelPath !== undefined ? st.labelPath : st.path ) + Step.SEPARATOR + child.label ;
				if (Step.hierarchies[ancestor.id] !== undefined) {
					Step.hierarchies[ancestor.id][child.path] = child ;
					if(child.label !== undefined) Step.hierarchies[ancestor.id][child.labelPath] = child ;
				}
				
			}else {
				ancestor = child.ancestor ;
				
				
				if (Step.hierarchies[ancestor.id] !== undefined) {
					Step.hierarchies[ancestor.id][child.path] = undefined ;
					delete Step.hierarchies[ancestor.id][child.path] ;
					if(child.label !== undefined) {
						Step.hierarchies[ancestor.id][child.labelPath] = undefined ;
						delete Step.hierarchies[ancestor.id][child.labelPath] ;
					}
				}
				
				child.index = - 1 ;
				child.parentStep = undefined ;
				child.ancestor = undefined ;
				child.depth = 0 ;
				child.path = undefined ;
			}
			return child ;
		},
		unregister:function(child) // returns Step
		{ return this.register(child, false) },
		registerAsAncestor:function(cond)// returns Step
		{
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
		unregisterAsAncestor:function(){ 
		   return this.registerAsAncestor(false) 
		},
		linkHierarchy:function(h){
		   this.hierarchyLinked = true ;
		   this.hierarchy = h ;
		   return this ;
		},
		unlinkHierarchy:function(h){
		   this.hierarchyLinked = false ;
		   this.hierarchy = undefined ;
		   delete this.hierarchy ;
		   return this ;
		},
		getIndexOfChild:function(child){
			var arr = this.children ;
			
			if('indexOf' in arr) return arr.indexOf(child) ;
			
			for(var i = 0 , l = arr.length ; i < l ; i++ ){
				if(arr[i] === child) break ;
			}
			
			return i ;
		},
		// PLAYHEAD HANDLING
		play:function(ref) //returns int
		{
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
						curChild.addEL('step_close', function step_close2(e){
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
		
		kill:function(ref) // returns int 
		{
			var st = this ;
			if(ref === undefined) ref = '$$current' ;
			
			var child;
			if (st.playhead == -1) return st.playhead ;
			
			if (ref == '$$current') {
				child = st.getChild(st.playhead) ;
			}else {
				child = st.getChild(ref) ;
			}
			var n = st.children.indexOf(child) ;
			
			child.close() ;
			st.playhead = -1 ;
			return n ;
		},
		// ORIENTATION INSIDE STEP CHILDREN
		//  NEXT PREV, 
		//  GETTERS AND CHECKERS
		
		next:function() // returns int
		{
			this.way = 'forward' ;
			if (this.hasNext()) return this.play(this.getNext()) ;
			else return -1 ;
		},
		prev:function() // returns int
		{
			this.way = 'backward' ;
			if (this.hasPrev()) return this.play(this.getPrev()) ;
			else return -1 ;
		},
		getNext:function() // returns Step
		{
			var s = this.children[this.playhead + 1] ;
			return this.looping ? s instanceof Step ? s : this.children[0] : s ;
		},
		getPrev:function() // returns Step
		{
			var s = this.children[this.playhead - 1] ;
			return this.looping? s instanceof Step ? s : this.children[this.getLength() - 1] : s ;
		},
		hasNext:function()// returns Boolean 
		{ return this.getNext() ?  true : this.looping },
		hasPrev:function()// returns Boolean 
		{ return this.getPrev() ?  true : this.looping },
		
		dumpChildren:function(str) // returns String
		{
			if(str === undefined) str = '' ;
			var chain = '                                                                            ' ;
			this.children.forEach(function(el, i, arr){
				str += chain.slice(0, el.depth) ;
				str += el ;
				if(parseInt(i+1) in arr) str += '\n' ;
			})
			return str ;
		},
		
		// TO STRING
		toString:function()
		{
			var st = this ;
			return '[Step >>> id:'+ st.id+' , path: '+st.path + ((st.children.length > 0) ? '[\n'+st.dumpChildren() +'\n]'+ ']' : ']') ;
		}
	}) ;
	var Address = Type.define({
		pkg:'net',
		domain:Type.appdomain,
		constructor:Address = function Address(str){
			var u = this ;
			u.absolute = str ;
			
			u.path = str.replace(/^(((http|ftp)s?:)\/\/([\w\d.-]+(:(\d+))?))?\/(([a-z0-9-]{3,}\/)*)?([#]\/|)?([a-z\/]{2}\/)?([^?]*)([?].+)?$/i, function(){
			   var $$ = [].slice.call(arguments) ;

			   u.base = $$[1] || '' ;
			   u.protocol = $$[3] || '' ;
			   u.host = $$[4] || '' ;
			   u.port = $$[6] || '' ;
			   u.root = $$[7] || '' ;
			   
			   u.qs = $$[12] || '' ;
			   u.loc = $$[10] || '';
			   u.hash = $$[9] || '';
			   
			   return $$[11] || '' ;
			}) ;
		},
		toString:function()
		{
			var st = this ;
			return this.absolute ;
		}
	}) ;
	var HierarchyChanger = Type.define({
		pkg:'hash',
		domain:Type.appdomain,
		statics:{
			__re_doubleSeparator:/(\/){2,}/ ,
			__re_qs:/\?.*$/ ,
			__re_path:/^[^?]+/ ,
			__re_endSlash:/\/$/ ,
			__re_startSlash:/^\// ,
			__re_hash:/^\/#\// ,
			DEFAULT_PREFIX:'#' ,
			SEPARATOR:Step.SEPARATOR
		},
		__hierarchy:undefined,
		__value:'',
		__currentPath:'',
		__home:'',
		__temporaryPath:undefined,
		__futurePath:'',    
		constructor:HierarchyChanger = function HierarchyChanger(){
			// trace(this.__value)
		},
		setFuturePath:function(path) 
		{
			this.__futurePath = path ;
		},
		setHierarchy:function(val){ this.__hierarchy = val },
		getHierarchy:function(){ return this.__hierarchy },
		setHome:function(val){ this.__home = val.replace(HierarchyChanger.__re_endSlash, '') },
		getHome:function(){ return this.__home = __home.replace(HierarchyChanger.__re_endSlash, '') },
		getValue:function(){ return this.__value = this.__value.replace(HierarchyChanger.__re_endSlash, '') },
		setValue:function(newVal){ this.hierarchy.redistribute(this.__value = newVal.replace(HierarchyChanger.__re_endSlash, '')) },
		getCurrentPath:function(){ return this.__currentPath = this.__currentPath.replace(HierarchyChanger.__re_endSlash, '') },
		setCurrentPath:function(val){ this.__currentPath = val.replace(HierarchyChanger.__re_endSlash, '')  },
		getFuturePath:function(){ return this.__futurePath = this.__futurePath.replace(HierarchyChanger.__re_endSlash, '') },
		getAvailable:function(){ return true },
		getTemporaryPath:function(){ return (this.__temporaryPath !== undefined) ? this.__temporaryPath = this.__temporaryPath.replace(HierarchyChanger.__re_endSlash, '') : undefined },
		setTemporaryPath:function(value){ this.__temporaryPath = value }
	}) ;
	var Hierarchy = Type.define({
		pkg:'hash',
		domain:Type.appdomain,
		idTimeout:-1 ,
		idTimeoutFocus:-1 ,
		idTimeoutFocusParent:-1 ,
		root:undefined , // Step
		currentStep:undefined , // Step
		changer:undefined ,// HierarchyChanger;
		exPath:'',
		command:undefined ,// Command;
		// CTOR
		constructor:Hierarchy = function Hierarchy(){
			//
		},
		setAncestor:function(s, changer)
		{
			var hh = this ;
			hh.root = s ;
			hh.root.registerAsAncestor() ;
			hh.root.linkHierarchy(this) ;
			
			hh.currentStep = hh.root ;
			
			hh.changer = changer || new HierarchyChanger() ;
			hh.changer.hierarchy = hh ;
			
			return s ;
		},
		add:function(step, at)
		{
			return (typeof at === 'string') ?  this.getDeep(at).add(step) : this.root.add(step) ;
		},
		remove:function(id, at)
		{
			return (typeof at === 'string') ? this.getDeep(at).remove(id) : this.root.remove(id) ;
		},
		getDeep:function(path)
		{
			var h = Step.hierarchies[this.root.id] ;
			return (path === this.root.id) ? this.root : h[HierarchyChanger.__re_startSlash.test(path)? path : HierarchyChanger.SEPARATOR + path] ;
		},
		getDeepAt:function(referenceHierarchy, path)
		{
			return Step.hierarchies[referenceHierarchy][path] ;
		},
		redistribute:function(path)
		{
			if (this.isStillRunning()) {
				this.changer.setTemporaryPath(path) ;
				return ;
			}else {
				this.changer.setTemporaryPath(undefined) ;
				this.launchDeep(path) ;
			}
		},
		launchDeep:function launchDeep(path) 
		{
			var hh = this ;
			
			if (path == hh.changer.getCurrentPath()) return ;
			
			
			// ici que l'on doit changer qqch
			hh.command = new CommandQueue(hh.formulate(path)) ;
			
			

			if(hh.command === undefined) {
			   trace('consider nothing has happened') ;
			   return ;
			}
			
			hh.command.addEL('$', hh.onCommandComplete) ;
			hh.command.caller = hh ;
			
			
			if (hh.currentStep.hasEL('focusOut')) {
				hh.currentStep.dispatchFocusOut() ;
				
				hh.currentStep.addEL('focusClearedOut', function(e) {
					hh.currentStep.removeEL('focusClearedOut', launchDeep) ;
					hh.command.execute() ;
				})
			}else {
				// for(var s in hh.command)
				// trace(s, hh.command[s])
				
				hh.command.execute() ;
				
			}
		},
		onCommandComplete:function onCommandComplete(e)
		{
			
			var hh = this.caller ;
			hh.command.removeEL('$', onCommandComplete) ;
			if(hh.root.addressComplete !== undefined && typeof(hh.root.addressComplete) == "function")
			hh.root.addressComplete(e) ;
			hh.clear() ;
		},
		clear:function()
		{
			var hh = this ;
			
			if(hh.command instanceof Command) hh.command = hh.command.cancel() ;
			//clearTimeout(hh.idTimeoutParent) ;
			clearTimeout(hh.idTimeout) ;
		},
		formulate:function(path)
		{
			var hh = this ;
			//trace('curpath >> '+ hh.changer.getCurrentPath()) ;
			//trace('formulating >> '+ path) ;
			var commands = [] ;
			var command ;
			
			if(hh.command === undefined) {
			   hh.changer.setFuturePath(path) ;
			}
			var state ;
			var cur = hh.currentStep ;
			var single ;
			
			var absolute = HierarchyChanger.SEPARATOR + path ;
			
			if(cur !== cur.ancestor){ // forced to be else than root
			   command = hh.createCommandClose(cur.path) ;
			   state = 'ascending' ;
			}
			
			// checking if same level >> brother step or not
			var curParent = cur.parentStep ;
			
			if(curParent !== undefined) {
					var l = curParent.getLength() ;
					for(var i  = 0 ; i < l ; i++){
				   var child = curParent.getChild(i) ;
				   
				   var presence_re = new RegExp("^"+child.path) ;
				   
				   if(presence_re.test(absolute) && cur !== child){
					  
					  absolute.replace(presence_re, function($0){
						 single = $0 ;
						 return '' ;
					  })
					  command = hh.createCommandOpen(single) ;
					  state = 'idle' ;
					  break ;
				   }
				}
			}
			
			// checking for addables
			var l = cur.getLength() ;
			for(var i  = 0 ; i < l ; i++){
			   var child = cur.getChild(i) ;
			   
			   var presence_re = new RegExp("^"+child.path) ;
			   
			   if(presence_re.test(absolute)){
				  absolute.replace(presence_re, function($0){
					 single = $0 ;
					 return '' ;
				  })
				  command = hh.createCommandOpen(single) ;
				  
				  if(state !== 'idle') state = 'descending' ;
				  break ;
			   }
			}
			
			if(command === undefined){
			   hh.clear() ;
			   throw new Error('No step was actually found with path ' + path) ;
			}
			
			
			hh.state = state || 'descending' ;
			
			return command ;
		},
		createCommandOpen:function(path)
		{
			var c = new Command(this, this.openCommand) ;
			c.params = [path, c] ;
			return c ;
		},
		openCommand:function(path, c)
		{
			var hh = c.context ;
			var st = hh.getDeep(path) ;
			clearTimeout(hh.idTimeoutFocus) ;
			
			st.addEL('step_open', function step_open(e){
				
				st.removeEL('step_open', step_open) ;
				hh.changer.setCurrentPath(path) ;
				
				var val = hh.changer.getValue() ;
				var cur = hh.changer.getCurrentPath().replace(/^\//i, '') ;
				var future = hh.changer.getFuturePath() ;
				
				hh.currentStep = st ;
				hh.currentStep.state = Step.STATE_OPENED ;
				
				if(cur === future){
					hh.idTimeoutFocus = setTimeout(function() {
						hh.currentStep.dispatchFocusIn() ;
					}, 20) ;
				}else{
					
					if(hh.isStillRunning()){
						hh.command.add(hh.formulate(future)) ;
					}else{
						hh.redistribute(future) ;
					}
					
				}
				c.dispatchComplete() ;
			}) ;
			
			st.parentStep.play(st.id) ;
			
			return st ;
		},
		createCommandClose:function(path)
		{
			var c = new Command(this, this.closeCommand) ;
			c.params = [path, c] ;
			return c ;
		},
		closeCommand:function(path, c)
		{
			var hh = c.context ;
			var st = hh.getDeep(path) ;
			
			clearTimeout(hh.idTimeoutFocusParent) ;
			
			st.addEL('step_close', function step_close(e){
				st.removeEL('step_close', step_close) ;
				st.state = Step.STATE_CLOSED ;
				
				hh.changer.setCurrentPath(st.parentStep.path) ;
				
				var val = hh.changer.getValue() ;
				var cur = hh.changer.getCurrentPath().replace(/^\//i, '') ; ;
				var future = hh.changer.getFuturePath() ;
				
				hh.currentStep = st.parentStep ;
				
				
				if(cur === future){
					hh.idTimeoutFocusParent = setTimeout(function() {
						hh.currentStep.dispatchFocusIn() ;
					}, 20) ;
				}else{
					
					if(hh.isStillRunning()){
						hh.command.add(hh.formulate(future)) ;
					}else{
						hh.redistribute(future) ;
					}
				   
				}
				c.dispatchComplete() ;
			})  
			st.parentStep.kill() ;
			return st ;
		},
		isStillRunning:function(){ return this.command instanceof Command},
		getRoot:function(){ return this.root },
		getCurrentStep:function(){ return this.currentStep },
		getChanger:function(){ return this.changer },
		getCommand:function(){ return this.command }
	}) ;
	var AddressHierarchy = Type.define({
		pkg:'hash',
		inherits:Hierarchy,
		domain:Type.appdomain,
		statics:{
			parameters:{
				home:'home/',
				base:location.protocol + '//'+ location.host + location.pathname ,
				useLocale:true
			},
			unique:undefined,
			isReady:function(){
				var address = new Address(window.location.href) ;
				var base = address.base + '/' + address.root ;
				
				return base == AddressHierarchy.parameters.base ;
			},
			create:function(uniqueclass){
				return new AddressHierarchy((AddressHierarchy.unique = uniqueclass)) ;
			},
			setup:function(params){
				AddressHierarchy.parameters = params ;
				return AddressHierarchy ;
			}
		},
		constructor:AddressHierarchy = function AddressHierarchy(s){
			AddressHierarchy.base.call(this) ;
			this.changer = new AddressChanger() ;
			AddressHierarchy.instance = window.hierarchy = this ;
			this.initAddress(s) ;
		},
		sliceLocale:function(value)
		{
			var changer = this.changer ,
			startSlash = HierarchyChanger.__re_startSlash ,
			endSlash = HierarchyChanger.__re_endSlash ,
			path = '' ,
			lang = '' ;
			
			path = value.replace(/^[a-z]{2}\//i, function($0, $1){
			  lang = $1 ;
			  return '' ;
			}) ;
			
			return path.replace(endSlash, '').replace(startSlash, '') ;
		},
		initAddress:function(s)
		{
			this.changer.enable(location, this, s) ;// supposed to init the SWFAddress-like Stuff
			trace('JSADDRESS inited, @'+ AddressHierarchy.parameters.base+', '+location.hash) ;
		},
		redistribute:function(value)
		{
			var hh = this ;
			value = hh.sliceLocale(value) ;
			
			var barpath = hh.changer.getCurrentPath() ;
			var cpath = hh.currentStep.path ;
			
			if (hh.isStillRunning()) {
				hh.changer.setFuturePath(value) ;
				trace('>> still running...')
			}else {
				hh.changer.setFuturePath(undefined) ;
				hh.launchDeep(value) ;
			}
			
		}
	}) ;
	
	var AddressChanger = Type.define({
		pkg:'hash',
		inherits:HierarchyChanger,
		domain:Type.appdomain,
		statics:{
			hashEnable:function(href){
				return '#' + href.replace(new RegExp(window.location.protocol + '//' + window.location.host), '').replace(/\/*$/,'/').replace(/^\/*/,'/').replace(/\/\/+/, '/') ;
			}
		},
		constructor:AddressChanger = function AddressChanger(s){
			AddressChanger.base.call(this) ;
		},
		enable:function(loc, hierarchy, uniqueClass){
			var u = this ;
			var hh = u.hierarchy = hierarchy ;
			// character stocking ONCE and for ALL
			
			var hashChar = '#' ,
			separator = HierarchyChanger.SEPARATOR ,
			hashReg = new RegExp(hashChar) ,
			doubledSeparatorReg = HierarchyChanger.__re_doubleSeparator ,
			startSlashReg = HierarchyChanger.__re_startSlash ,
			endSlashReg = HierarchyChanger.__re_endSlash ,
			initLocale = document.documentElement.getAttribute('lang'),
			
			// base location object stuff
			href =  loc.href , // -> http://dark:13002/#/fr/unsubscribe/
			protocol =  loc.protocol , // -> http:
			hostname =  loc.hostname , // -> dark
			port =  loc.port , // -> 13002
			host =  loc.host , // -> dark:13002
			pathname =  loc.pathname , // -> /
			hash = loc.hash , // -> #/fr/unsubscribe/
			search = loc.search ; // -> (empty string)
			
			var a = new Address(href) ;
			
			var weretested = false ;
			
			if(!hashReg.test(a.absolute)) { // means it never has been hashchanged, so need to reset hash...
				
				weretested = true ;
				u.locale = (a.loc !== '' ? a.loc : initLocale + separator ) ;
				// resetting AJAX via Hash
				
				if(a.path === '' && a.loc === '') {
					var p = hashChar + separator + u.locale + a.path + a.qs ;
					location.hash = p ;
					
					// window.location.reload() ;
				}else{
					loc.href = separator + a.root + hashChar + separator + u.locale + a.path + a.qs ;
				}
			}
			u.locale = u.locale || a.loc ;
			
			hh.setAncestor(uniqueClass.getInstance(), u) ;
			// INIT HASHCHANGE EVENT WHETHER ITS THE FIRST OR SECOND TIME CALLED
			// (in case there was nothing in url, home page was requested, hashchange wont trigger a page reload anyway)
			$(window).bind('hashchange', function(e){
				// need to debug if comes such as
				//   -  '#'
				//  -  '#/'
				// 
				
				if(u.skipHashChange !== undefined) {
				   u.skipHashChange = undefined ;
				   return ;
				}
				
				var h = location.hash ;
				
				// if multiple unnecessary separators
				if(doubledSeparatorReg.test(h)){
					location.hash = h.replace(doubledSeparatorReg, separator) ;
					return ;
				}
				a = new Address(separator + h) ;
				
				if(a.loc === ''){ // if Locale is missing
				   location.hash = separator + u.locale + a.path + a.qs ;
				   return ;
				}
				
				if(a.path === ''){ // if path is absent
				   location.hash = a.hash + a.loc + AddressHierarchy.parameters.home + a.qs ;
				   return ;
				}
				
				
				if(!endSlashReg.test(a.path)){ // if last slash is missing
				   location.hash = a.hash + a.loc + a.path + separator + a.qs ;
				   return ;
				   
				}
				
				hh.changer.__value = separator + a.loc + a.path ;
				hh.redistribute(a.loc + a.path) ;
				
				return ;
			})
			
			// OPENS UNIQUE STEP FOR REAL, THEN SET THE FIRST HASCHANGE
			hh.root.bind('step_open', function rrr(e){
				hh.root.unbind('step_open', rrr) ;
				setTimeout(function(){
					if(!weretested)
					$(window).trigger('hashchange') ;
				}, 1) ;
			})
			
			hh.root.open() ;
			return true ;
		},
		setValue:function(newVal, cond){
		   if(cond == undefined) cond = true ;
		   if(!cond) this.skipHashChange = true ;
		   
		   window.location.hash = (this.__value = newVal.replace(HierarchyChanger.__re_endSlash, '')+'/') ;
		}
	}) ;
	
	/* MAIN StrawExpress TOOLKIT */
	var WebApp = Type.define({
		pkg:'::WebApp',
		inherits:EventDispatcher,
		domain:Type.appdomain,
		statics : {
			app:undefined,
			unique:undefined,
			Qexists : function Qexists(sel, sel2) {
				if(sel2 !== undefined) sel = $(sel).find(sel2) ;
				sel = sel instanceof $ ? sel : $(sel) ;
				var s = new Boolean(sel.length > 0) ;
				s.target = sel ;
				return (s.valueOf()) ? s.target : undefined ;
			},
			initialize:function(){
				WebApp.app = new WebApp(window) ;
			},
			listen:function listen(type, closure){
				WebApp.app.bind(type, closure) ;
				return this ;
			},
			discard:function discard(type, closure){
				WebApp.app.unbind(type, closure) ;
				return this ;
			},
			address:function address(params){
				AddressHierarchy.setup(params) ; ;
				return this ;
			},
			isReady:function(){
				return AddressHierarchy.isReady() ;
			},
			createClient:function createClient(){
				AddressHierarchy.create(WebApp.unique) ;
				return this ;
			},
			uniquestep:function uniquestep(unique){
				WebApp.unique = unique ;
				return this ;
			},
			initJSAddress:function initJSAddress(s){
				AddressHierarchy.unique.getInstance().commandOpen.dispatchComplete() ;
				return this ;
			},
			destroy:function destroy(){
				WebApp.unique.instance = WebApp.unique.getInstance().destroy() ;
			}
		},
		constructor:WebApp = function WebApp(win){
			WebApp.base.apply(this, [win]) ;
			return this ;
		}
	}) ;
	
	
	return WebApp ;
	
})