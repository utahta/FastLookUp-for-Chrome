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
        e.innerHTML = txt;
        res.push( e );
        
        var branding_e = document.createElement( "div" );
        branding_e.style.paddingTop = "3px";
        branding_e.innerHTML = branding;
        res.push( branding_e );
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

MousePos = {
    x: 0,
    y: 0,

    set: function( ev )
    {
        MousePos.x = ev.pageX;
        MousePos.y = ev.pageY;
    },

    debugPrint: function()
    {
        alert( "x:"+MousePos.x+" y:"+MousePos.y );
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

    position: function()
    {
        this.top_obj.style.left = (MousePos.x + 15) + "px";
        this.top_obj.style.top = (MousePos.y + 15) + "px";
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
            this.position();
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
    txt: "",
    msgid_list: [],
    index: 0,
 
    clear: function()
    {
        this.msgid_list = [];
    },

    length: function()
    {
        return this.msgid_list.length;
    },

    push: function( msgid )
    {
        this.msgid_list.push( msgid );
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
            var msgid = this.msgid_list[this.index++];
            Connection.postMessage( {msgid:msgid, txt:this.txt} );
        }
    },

    /**
     * @brief choose a translator.
     * @param ev event object.
     * @param is_word true:Word, false:Sentence
     */
    chooseTranslator: function( ev, is_word )
    {
        // System setting.
        this.clear();
        
        // enable optimum?
        if( Options.get('optimum') ){
            // using excite.
            if( is_word ){
                this.tryExciteTranslator( ev );
            }
            this.tryGoogleTranslator( ev );
        }
        else{
            this.tryExciteTranslator( ev );
            this.tryGoogleTranslator( ev );
        }
        return this.length();
    },
    
    // excite.
    tryExciteTranslator: function( ev ){
        if( Options.get('excite')["use"] && 
            ev.ctrlKey == Options.get('excite')["ctrl_key"] && ev.shiftKey == Options.get('excite')["shift_key"] && ev.altKey == Options.get('excite')["alt_key"] ){
            this.push( "excite_pre" );
        }
    },
    
    // google.
    tryGoogleTranslator: function( ev ){
        if( Options.get('google')["use"] && 
            ev.ctrlKey == Options.get('google')["ctrl_key"] && ev.shiftKey == Options.get('google')["shift_key"] && ev.altKey == Options.get('google')["alt_key"] ){
            this.push( "google" );
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
                Dialog.show( Parser.google( arg.txt, arg.branding ) );
            }
        }
        else if( arg.msgid == "loading" ){
            Dialog.loading();
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
                 'background: ' + Options.get('background_color') + " !important",
                 'top: 0',
                 'left: 0',
                 'max-width: 70% !important',
                 'max-height: 50% !important',
                 'width: auto !important',
                 'height: auto !important',
                 'display: none',
                 'padding:7px !important',
                 'margin:0 !important',
                 'z-index: 999999 !important',
                 '-webkit-box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.65) !important',
                 '-webkit-border-radius: 7px !important',
                 'overflow: auto !important'];
        var fastlookup_top_css = "#fastlookup_top{" + style.join(";") + "}";
        
        style = ['color: ' + Options.get('font_color') + ' !important',
                 'font-family:'+ Options.get('font_family') + ' !important',
                 'font-size: '+ Options.get('font_size') +'px !important',
                 'font-style: ' + Options.get('font_style') + ' !important',
                 'opacity: ' + Options.get('opacity') + ' !important',
                 'font-variant: normal !important',
                 'font-weight: normal !important',
                 'text-align: left !important',
                 'margin:0 !important'];
        var fastlookup_css = "#fastlookup{" + style.join(";") + "}";
        
        var other_css = "#fastlookup img{padding:0; margin:0; display:inline; border:0; clear:both;}" +
                        "#fastlookup a{color:#000; margin:0; padding:0;}" +
                        "#fastlookup p{margin:5px; padding:0;}";

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
        if( !txt || txt.match(/^\s+$/) || !System.chooseTranslator( ev, (txt.match(/^(\W+|)\S+(\W+|)$/) != null) ) ){
            return;
        }
        MousePos.set( ev );

        System.initialize( txt );
        System.translation();
    }
}, false );

document.addEventListener( "mousedown", function( ev ){
    if( !Utility.checkId( ev, 'fastlookup_top' ) ){
        if( Dialog.exist() ){
            window.getSelection().removeAllRanges();
            Dialog.remove();
        }
        System.clear();
    }
}, false );

