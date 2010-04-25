// read once.
if( window['fastlookup-for-chrome-main-loaded'] ){
    throw "already loaded.";
}
window['fastlookup-for-chrome-main-loaded'] = true;
var loading_img_url = chrome.extension.getURL("loadinfo.gif");

Connection = null; // chrome connection.
Utility = {
    createTag: function( txt, url )
    {
        var e = document.createElement( "div" );
        e.innerHTML = "by <a href='"+url+"' onclick='window.open(this.href, \"fastlookpop\"); return false;'>"+txt+"</a>";
        return e;
    },
    
    checkId: function( ev, id )
    {
        if( ev.target.id == id ) return true;
        if( ev.target.parentNode ){
            var t = ev.target.parentNode;
            do{
                if( t.id == id ) return true;
            }while( t = t.parentNode );
        }
        return false;
    }
};

Parser = {
    alc: function( txt )
    {
        var res = [];
        var r = Parser.getSnapshot( './/li[span[@class="midashi"] and (position()=1)]', txt );
        if( !r ){
            return res;
        }
        if( r.snapshotLength == 0 ){
            return res;
        }

        for( var i = 0; i < r.snapshotLength; i++ ){
            res.push( r.snapshotItem(i) );
        }
        //res.push( Utility.createTag( "Alc", "http://www.alc.co.jp/" ) );
        return res;
    },
    
    excite_pre: function( txt )
    {
        var res = [];
        var r = Parser.getSnapshot( './/ol[@class="lh140" and (position()=1)]/li/a/@href', txt );
        if( !r ){
            return res;
        }
        if( r.snapshotLength == 0 ){
            return res;
        }

        for( var i = 0; i < r.snapshotLength; i++ ){
            res.push( r.snapshotItem(i).textContent );
        }
        return res;
    },

    excite: function( txt )
    {
        var res = [];
        var r = Parser.getSnapshot( './/p[@class="lh140" and (position()=1)]', txt );
        if( !r ){
            return res;
        }
        if( r.snapshotLength == 0 ){
            return res;
        }
        
        for( var i = 0; i < r.snapshotLength; i++ ){
            var e = r.snapshotItem(i);
            try{
                // add window.open to <a> tag.
                e.innerHTML = e.innerHTML.replace( /<a/g, "<a onclick='window.open(this.href, \"fastlookpop\", \"menubar=no, toolbar=no\"); return false;'" );
                res.push( e );
            }
            catch(e){
            }
            e.setAttribute( "id", "fastlookup" );
            e.setAttribute( "class", "" );
            res.push( e );
        }
        //res.push( Utility.createTag( "powerd by excite", "http://www.excite.co.jp/world/" ) );
        return res;
    },
    
    google: function( txt, branding )
    {
        var res = [];
        var e = document.createElement( "div" );
        e.setAttribute( 'id', 'fastlookup' );
        
        var tmp = null;
        for( var i = 0; i < txt.length; i++ ){
            tmp = document.createElement( "div" );
            tmp.setAttribute( 'class', 'additional' );
            tmp.innerHTML = txt[i];
            e.appendChild(tmp);
        }
        
        tmp = document.createElement( "div" );
        tmp.setAttribute( 'class', 'branding' );
        tmp.innerHTML = branding;
        e.appendChild(tmp);
        
        res.push( e );
        return res;
    },

    getSnapshot: function( exp, txt )
    {
        try{
            var e = document.createElement( "div" );
            e.innerHTML = txt;
        }
        catch(e){
            // catch dom exception.
            return false;
        }
        
        var resolver = function( prefix ){
            var o = e.ownerDocument == null ? e.documentElement : e.ownerDocument.documentElement;
            var r = document.createNSResolver(o)(prefix);
            return r ? r : (document.contentType == "text/html") ? "" : "http://www.w3.org/1999/xhtml";
        };
        try{
            var exp = document.createExpression( exp, resolver );
            var r = exp.evaluate( e, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
        }
        catch(e){
            return false;
        }
        return r;
    }
};

Position = {
    x: 0,
    y: 0,
    range: null,

    set: function( ev, selection )
    {
        this.x = ev.pageX;
        this.y = ev.pageY;

        if( !selection || !selection.baseNode ){
            return;
        }
        this.range = selection.getRangeAt(0);
    },

    _adjustMouse: function( d )
    {
        d.style.left = (this.x + 15) + "px";
        d.style.top = (this.y + 15) + "px";
    },
    
    _adjustTop: function( d )
    {
        var range = this.range;
        if( !range ){
            return;
        }
        var offset = 5;
        var node = document.createElement('span');
        range.insertNode( node );
        offsets = this._getOffsets( node );
        offsets.offsetHeight = node.offsetHeight;
        node.parentNode.removeChild( node );
        delete node;

        if( offsets.top - document.body.scrollTop >= d.offsetHeight ){
            d.style.top = (offsets.top - d.offsetHeight - offset) + 'px';
        } else {
            d.style.top = (offsets.top + offsets.offsetHeight + offset) + 'px';
        }
        d.style.left = offsets.left + 'px';
    },
    
    _adjustBottom: function( d )
    {
        var range = this.range;
        if( !range ){
            return;
        }
        var offset = 5;
        var node = document.createElement('span');
        range.insertNode( node );
        offsets = this._getOffsets( node );
        offsets.offsetHeight = node.offsetHeight;
        node.parentNode.removeChild( node );

        var tmpRange = document.createRange();
        tmpRange.setStartAfter( range.endContainer );
        tmpRange.insertNode( node );
        offsets.top = this._getOffsets( node ).top;
        node.parentNode.removeChild( node );
        delete node;
        delete tmpRange;
        
        console.log( (offsets.top - document.body.scrollTop + offsets.offsetHeight + d.offsetHeight) + " <= " + document.body.clientHeight );
        if( (offsets.top - document.body.scrollTop + offsets.offsetHeight + d.offsetHeight) <= document.body.clientHeight ){
            d.style.top = (offsets.top + offsets.offsetHeight + offset) + 'px';
        }
        else{
            d.style.top = (offsets.top - d.offsetHeight - offset) + 'px';
            console.log( "fuga" );
        }
        d.style.left = offsets.left + 'px';
    },
    
    _getOffsets: function( el )
    {
        var t = l = 0;
        do{
            t += el.offsetTop || 0;
            l += el.offsetLeft || 0;
            el = el.offsetParent || null;
        }while(el);
        return {'top': t, 'left': l};
    },
    
    adjust: function( d )
    {
        var opt = Options.get('position');
        if( opt == 'Top' ){
            this._adjustTop( d );
        }
        else if( opt == 'Bottom' ){
            this._adjustBottom( d );
        }
        else if( opt == 'Mouse' ){
            this._adjustMouse( d );
        }
        else{
            this._adjustTop( d );
        }
    },

    debugPrint: function()
    {
        alert( "x:"+this.x+" y:"+this.y );
    }
};

Dialog = {
    top_obj: null,
    loading_obj: null,
    noitems_obj: null,
    
    initialize: function()
    {
        if( this.exist() ){
            return;
        }
        // create a dialog element.
        if( !document.getElementById('fastlookup_top') ){
            var d = document.createElement( 'div' );
            d.id = 'fastlookup_top';
            document.body.appendChild( d );
        }
        this.top_obj = document.getElementById( 'fastlookup_top' );
        
        // create a loading element.
        this.loading_obj = document.createElement( "div" );
        this.loading_obj.setAttribute( 'id', 'fastlookup' );
        var i = document.createElement( "img" );
        i.src = loading_img_url;
        var t = document.createTextNode( chrome.i18n.getMessage("search_for") );
        this.loading_obj.appendChild( i );
        this.loading_obj.appendChild( t );
        
        // create a no items element.
        this.noitems_obj = document.createElement( "div" );
        this.noitems_obj.setAttribute( 'id', 'fastlookup' );
        this.noitems_obj.appendChild( document.createTextNode( chrome.i18n.getMessage("no_items_found") ) );
    },
    
    exist: function()
    {
        if( this.top_obj == null || this.top_obj.style.display == 'none' ){
            return false;
        }
        return true;
    },

    remove: function()
    {
        if( !this.exist() ){
            return;
        }
        this.top_obj.style.display = 'none';
        for( var i = this.top_obj.childNodes.length-1; i >= 0; i-- ){
            this.top_obj.removeChild( this.top_obj.childNodes[i] );
        }
    },

    show: function( res )
    {
        if( !res.length ){
            this.notFound();
        }
        else{
            this.remove();
            res.forEach( function( e ){
                Dialog.top_obj.appendChild( e );
            });
            this.top_obj.style.display = 'block';
            Position.adjust( this.top_obj );
        }
    },

    loading: function()
    {
        var res = [this.loading_obj];
        this.show( res );
    },

    error: function( errno )
    {
        var res = [this.noitems_obj];
        console.error( "errno:"+errno );
        this.show( res );
    },

    notFound: function()
    {
        var res = [this.noitems_obj];
        this.show( res );
    }
};

System = {
    msgid_list: [],
    index: 0,
    txt: "",
 
    clear: function()
    {
        this.msgid_list = [];
    },

    length: function()
    {
        return this.msgid_list.length;
    },

    push: function( msgid, lang )
    {
        this.msgid_list.push( {
            'msgid': msgid,
            'lang': lang
        });
    },
    
    remove: function( msgid )
    {
        var index = -1;
        for( var i = 0; i < this.length(); i++ ){
            if( this.msgid_list[i].msgid == msgid ){
                index = i;
                break;
            }
        }
        if( index < 0 ){
            return;
        }
        this.msgid_list.splice( index, 1 );
    },

    initialize: function( txt )
    {
        this.index = 0;
        this.txt = txt;
    },

    translation: function()
    {
        if( this.length() == 0 ){
            return;
        }
        
        if( this.length() <= this.index ){
            Dialog.notFound();
        }
        else{
            var msgid = this.msgid_list[this.index].msgid;
            var lang = JSON.stringify( this.msgid_list[this.index].lang );
            this.index++;
            Dialog.loading();
            Connection.postMessage( {'msgid':msgid, 'lang':lang, 'txt':this.txt} );
        }
    },

    /**
     * @brief choose a translator.
     * @param ev event object.
     * @param txt Word or Sentence
     */
    chooseTranslator: function( ev, txt )
    {
        // System setting.
        this.clear();

        // add translator.
        this._addExciteTranslator( ev );
        this._addGoogleTranslator( ev );
        
        // enable optimum?
        if( this.length() >= 2 ){
            // remove excite?
            if( txt.match(/^(\W+|)\S+(\W+|)$/) == null ){
                this.remove('excite_pre');
            }
        }
        return this.length();
    },
    
    // excite.
    _addExciteTranslator: function( ev ){
        if( Options.get('excite').use && 
            ev.ctrlKey == Options.get('excite').ctrl_key && 
            ev.shiftKey == Options.get('excite').shift_key && 
            ev.altKey == Options.get('excite').alt_key &&
            ev.metaKey == Options.get('excite').meta_key ){
            this.push( "excite_pre", [] );
        }
    },
    
    // google.
    _addGoogleTranslator: function( ev ){
        var google = Options.get('google');
        if( google.use ){
            var lang = [];
            for( var i = 0; i < google.settings.length; i++ ){
                if( ev.ctrlKey == google.settings[i].ctrl_key && 
                    ev.shiftKey == google.settings[i].shift_key && 
                    ev.altKey == google.settings[i].alt_key &&
                    ev.metaKey == google.settings[i].meta_key ){
                    
                    lang.push({
                        'from': google.settings[i].from,
                        'to': google.settings[i].to
                    });
                }
            }
            if( lang.length > 0 ){
                this.push( "google", lang );
            }
        }
    }
};

Options = {
    options_data: {},

    load: function( arg )
    {
        this.options_data = JSON.parse( arg.options_data );
    },
    
    get: function(key)
    {
        return this.options_data[key];
    }
};

Receiver = {
    message: function( arg )
    {
        if( arg.msgid == "options" ){
            Options.load( arg );
            Style.update();
        }
        else if( arg.msgid == "alc" ){
            var res = Parser.alc( arg.txt );
            if( !res.length ){
                System.translation();
            }
            else{
                Dialog.show( res );
            }
        }
        else if( arg.msgid == "excite_pre" ){
            var res = Parser.excite_pre( arg.txt );
            if( !res.length ){
                System.translation();
            }
            else{
                Connection.postMessage( {msgid:"excite", txt:res[0]} );
            }
        }
        else if( arg.msgid == "excite" ){
            var res = Parser.excite( arg.txt );
            if( !res.length ){
                System.translation();
            }
            else{
                Dialog.show( res );
            }
        }
        else if( arg.msgid == "google" ){
            if( !arg.txt ){
                System.translation();
            }
            else{
                Dialog.show( Parser.google( JSON.parse(arg.txt), arg.branding ) );
            }
        }
        else if( arg.msgid == "error" ){
            Dialog.error( arg.errno );
        }
   }
};

Style = {
    css: null,
    text_node: null,
        
    /**
     * @brief add style to head.
     */
    add: function()
    {
        Style.css = document.createElement( "style" );
        Style.text_node = document.createTextNode( Style._getStyle() );
        Style.css.type = "text/css";
        Style.css.appendChild( Style.text_node );
        document.getElementsByTagName( "head" )[0].appendChild( Style.css );
    },

    /**
     * @brief update style
     */
    update: function()
    {
        if( Style.css == null ){
            Style.add();
            return;
        }
        
        if( Style.text_node != null ){
            Style.css.removeChild( Style.text_node );
        }
        Style.text_node = document.createTextNode( Style._getStyle() );
        Style.css.appendChild( Style.text_node );
    },

    /**
     * @brief get style string.
     * @note
     * like private method.
     */
    _getStyle: function()
    {
        var style;
        style = ['position: absolute !important',
                 'border: 1px solid #000 !important',
                 'opacity: ' + Options.get('opacity') + ' !important',
                 'background: ' + Options.get('background_color') + " !important",
                 'top: 0',
                 'left: 0',
                 'max-width: 50% !important',
                 'max-height: 50% !important',
                 'width: auto !important',
                 'height: auto !important',
                 'display: none',
                 '-webkit-box-shadow: 3px 3px 4px rgba(0, 0, 0, 0.65) !important',
                 '-webkit-border-radius: 10px !important',
                 'padding:0 !important',
                 'margin:0 !important',
                 'z-index: 999999 !important',
                 'overflow: auto !important'];
        var fastlookup_top_css = "#fastlookup_top{" + style.join(";") + "}";
        
        style = ['color: ' + Options.get('font_color') + ' !important',
                 'font-family:'+ Options.get('font_family') + ' !important',
                 'font-size: '+ Options.get('font_size') +'px !important',
                 'font-style: ' + Options.get('font_style') + ' !important',
                 'font-variant: normal !important',
                 'font-weight: normal !important',
                 'text-align: left !important'];
        var fastlookup_css = "#fastlookup{" + style.join(";") + "; margin:0 !important; padding:8px !important;}";
        
        var other_css = ["#fastlookup img{padding:0 !important; margin:0 !important; display:inline !important; border:0 !important; clear:both !important;}",
                         "#fastlookup a{color:#000 !important; margin:0 !important; padding:0 !important;}",
                         "#fastlookup p{margin:0 !important; padding:8px !important;}",
                         "#fastlookup .additional{" + style.join(";") + "; margin:0px !important; padding:0px 0px 8px 0px !important;}",
                         "#fastlookup .branding{margin:0px !important; padding:0px 0px 0px 0px !important;}"].join('');

        return fastlookup_top_css + fastlookup_css + other_css;
    }
};

// --- main ---
Style.add();
Dialog.initialize();

// Connection & Load options.
Connection = chrome.extension.connect( {name:"fastlookup"} );
Connection.onMessage.addListener( Receiver.message );
Connection.postMessage( {msgid:"options"} );

// trigger.
document.addEventListener( "mouseup", function( ev ){
    if( !Utility.checkId( ev, 'fastlookup_top' ) ){
        var txt = window.getSelection().toString();
        // empty or only space or not select short cut?
        if( !txt || txt.match(/^\s+$/) || !System.chooseTranslator( ev, txt ) ){
            return;
        }
        Position.set( ev, window.getSelection() );
        
        System.initialize( txt );
        System.translation();
    }
}, false );

document.addEventListener( "mousedown", function( ev ){
    if( !Utility.checkId( ev, 'fastlookup_top' ) ){
        if( Dialog.exist() ){
            window.getSelection().empty();
            Dialog.remove();
        }
        System.clear();
    }
}, false );

