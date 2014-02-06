var tr = tr || function(bar){ return bar; };

function SharingController(server, sessionid, silent){
  if (!"WebSocket" in window) {
    alert(tr("WebSocket is not supported by your browser."));
    return;
  }

  this.sharedElements = {};
  this.owner = this.generateId();

  this.currentMessage = 0; 

  this.ws = new WebSocket('ws://' + server.host + ':' + server.port + '/' + server.alias);
  
  this.ws.onopen = (function() {
    this.ws.send(JSON.stringify({"type": 'register', "sessionid": sessionid}));
  }).bind(this);
  
  this.ws.onmessage = (function(e) {
    var msg = JSON.parse(e.data);
    this.process(msg);
  }).bind(this);

  this.ws.onclose = function() {
    if (!silent) {
      alert(tr("Connection to server closed."));
    }
  };
};

var sharingControllerTimeout = 10000;
var sharingControllerInterval = 100;

SharingController.prototype = {
  process: function(msg, cnt) {
    var cnt = cnt || 0;
    if (msg.mid != this.currentMessage) {
      setTimeout( 
        (function(msg, that, cnt) {
           var msg = msg;
           var that = that;
           var foo = function() {
             if (cnt < (sharingControllerTimeout / sharingControllerInterval)) {
               that.process(msg, cnt);
             } else {
               alert(tr("Timeout: Server has not sent valid message."));
             }
           };
           return foo;
         })(msg, this, cnt+1),
        sharingControllerInterval);
      return;
    }
    if (msg.content.owner != this.owner) {
      if (msg.type == 'new') {
        this.do_new(msg.content);
      }
      if (msg.type == 'call') {
        this.do_call(msg.content);
      }
      if (msg.type == 'exec') {
        this.do_exec(msg.content);
      }
    }
    this.currentMessage = this.currentMessage + 1;
  },

  jsonsend: function(msgtype, args) {
    args.owner = this.owner;
    this.ws.send(JSON.stringify({"type": msgtype, "content": args}));
    return args;
  },

  dumpArguments: function(args) {
    return args.map(
      function( el ) {
        if (typeof el.wsid === 'undefined') {
          return el;
        } else {
          return el.wsid;
        }
      }
    );
  },

  getArguments: function(jsonargs) {
    ret = jsonargs.map(
      (function( el ) {
        if (el in this.sharedElements) {
          return 'this.sharedElements[' + el + ']';
        } else {
          return JSON.stringify(el);
        }
      }).bind(this)
    );
    ret.push('guest');
    ret.push('owner');
    return ret.join(',');
  },

  ws_eval: function(owner, evaltext) {
    guest = (owner != this.owner);
    var foo = (function() {
      eval(evaltext);
    }).bind(this);
    return foo;
  },

  news: function(cons){
    wsid = this.generateId();
    args = this.dumpArguments(Array.prototype.slice.call(arguments, 1));
    jsonargs = this.jsonsend('new', {
        "wsid": wsid, 
        "cons": cons.name, 
        "args": args
    });
    this.do_new(jsonargs);
    return this.sharedElements[wsid];
  },

  do_new: function(args) {
    evaltext = 'this.sharedElements["WSID"] = new CONS(ARGUMENTS);'
        .replace(/WSID/g, args.wsid)
        .replace(/CONS/g, args.cons)
        .replace(/ARGUMENTS/g, this.getArguments(args.args));
    this.ws_eval(args.owner, evaltext)();
    this.sharedElements[args.wsid].wsid = args.wsid;
    this.sharedElements[args.wsid].owner = args.owner;
  },

  call: function(obj, foo) {
    args = this.dumpArguments(Array.prototype.slice.call(arguments, 2));
    jsonargs = this.jsonsend('call', {
        "wsid": obj.wsid, 
        "foo": foo, 
        "args": args
    });
    this.do_call(jsonargs);
  },

  do_call: function(args) {
    evaltext = 'this.sharedElements["WSID"].FOO(ARGUMENTS);'
        .replace(/WSID/g, args.wsid)
        .replace(/FOO/g, args.foo)
        .replace(/ARGUMENTS/g, this.getArguments(args.args));
    this.ws_eval(args.owner, evaltext)();
  },

  exec: function(foo) {
    args = this.dumpArguments(Array.prototype.slice.call(arguments, 1));
    jsonargs = this.jsonsend('exec', {
        'foo': foo, 
        'args': args
    });
    this.do_exec(jsonargs);
  },

  do_exec: function(args) {
    evaltext = 'FOO(ARGUMENTS);'
        .replace(/FOO/g, args.foo)
        .replace(/ARGUMENTS/g, this.getArguments(args.args));
    this.ws_eval(args.owner, evaltext)();
  },

  generateId: function(args) {
    return (Math.random(1000000)+Date.now());
  }
};

