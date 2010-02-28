var loading_img_url = chrome.extension.getURL("loadinfo.gif");

window.Connection = null; // chrome connection.
window.Utility = {
    createTag: function( txt, url )
    {
        var e = document.createElement( "div" );
        e.innerHTML = "by <a href='"+url+"' onclick='window.open(this.href, \"fastlookpop\"); return false;'>"+txt+"</a>";
        return e;
    }
}

window.Parser = {
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
        //res.push( Utility.createTag( "英辞郎 on the WEB", "http://www.alc.co.jp/" ) );
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
                // <a>タグはポップアップ表示に変換します
                e.innerHTML = e.innerHTML.replace( /<a/g, "<a onclick='window.open(this.href, \"fastlookpop\", \"menubar=no, toolbar=no\"); return false;'" );
                res.push( e );
            }
            catch(e){
            }
            e.setAttribute( "class", "" );
            res.push( e );
        }
        //res.push( Utility.createTag( "excite翻訳", "http://www.excite.co.jp/world/" ) );
        return res;
    },
    
    google: function( txt )
    {
        var res = [];
        var e = document.createElement( "div" );
        e.innerHTML = txt;
        res.push( e );
        //res.push( Utility.createTag( "google翻訳", "http://translate.google.co.jp/" ) );
        return res;
    },

    getSnapshot: function( exp, txt )
    {
        try{
            var e = document.createElement( "div" );
            e.innerHTML = txt; // throw dom exception.
        }
        catch(e){
            return false;
        }
        
        var resolver = function( prefix ){
            var o = e.ownerDocument == null ? e.documentElement : e.ownerDocument.documentElement;
            var r = document.createNSResolver(o)(prefix);
            return r ? r : (document.contentType == "text/html") ? "" : "http://www.w3.org/1999/xhtml";
        }
        try{
            var exp = document.createExpression( exp, resolver );
            var r = exp.evaluate( e, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
        }
        catch(e){
            return false;
        }
        return r;
    }
}

window.MousePos = {
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
}

window.PopUp = {
    obj: null,
    
    initialize: function()
    {
        PopUp.remove();
        PopUp.obj = document.createElement( "div" );
        PopUp.obj.setAttribute( "id", "fastlookup_top" );
    },

    remove: function()
    {
        if( !PopUp.obj ){
            return;
        }
        PopUp.obj.parentNode.removeChild( PopUp.obj );
        PopUp.obj = null;
    },

    position: function()
    {
        var s = PopUp.obj.style;
        s.left = (MousePos.x + 15) + "px";
        s.top = (MousePos.y + 15) + "px";
    },

    show: function( res )
    {
        if( !res.length ){
            PopUp.notFound();
        }
        else{
            PopUp.initialize();
            
            var o = document.createElement( "div" );
            o.setAttribute( "id", "fastlookup" );
            res.forEach( function( e ){
                o.appendChild( e );
            });
            PopUp.obj.appendChild( o );
           
            document.body.appendChild( PopUp.obj );
            PopUp.position();
        }
    },

    loading: function()
    {
        var res = [];
        var e = document.createElement( "div" );
        var i = document.createElement( "img" );
        i.src = loading_img_url;
        var t = document.createTextNode( " 検索中..." );
        e.appendChild( i );
        e.appendChild( t );
        res.push( e );
        PopUp.show( res );
    },

    error: function( errno )
    {
        var res = [];
        var e = document.createElement( "div" );
        e.appendChild( document.createTextNode( "項目が見つかりませんでした" ) );
        res.push( e );
        console.error( "errno:"+errno );
        PopUp.show( res );
    },

    notFound: function()
    {
        var res = [];
        var e = document.createElement( "div" );
        e.appendChild( document.createTextNode( "項目が見つかりませんでした" ) );
        res.push( e );
        PopUp.show( res );
    }
}

window.System = {
    txt: "",
    msgid_list: [],
    index: 0,
 
    clear: function()
    {
        System.msgid_list = [];
    },

    length: function()
    {
        return System.msgid_list.length;
    },

    push: function( msgid )
    {
        System.msgid_list.push( msgid );
    },

    initialize: function( txt )
    {
        System.index = 0;
        System.txt = txt;
    },

    translation: function()
    {
        if( System.msgid_list.length <= System.index ){
            PopUp.notFound();
        }
        else{
            var msgid = System.msgid_list[System.index++];
            var txt = System.txt;
            Connection.postMessage( {msgid:msgid, txt:txt} );
        }
    },

    chooseTranslator: function( ev )
    {
        // System setting.
        System.clear();

        //System.push( "alc" ); // alc. プラグインとして利用すると規約違反らしいので無効化
        
        // excite.
        if( Options.excite["use"] && ev.ctrlKey == Options.excite["ctrl_key"] && ev.shiftKey == Options.excite["shift_key"] && ev.altKey == Options.excite["alt_key"] ){
            System.push( "excite_pre" );
        }

        // google.
        if( Options.google["use"] && ev.ctrlKey == Options.google["ctrl_key"] && ev.shiftKey == Options.google["shift_key"] && ev.altKey == Options.google["alt_key"] ){
            System.push( "google" );
        }
        return System.length();
    }
}

window.Options = {
    font_size: 13,
    excite: {},
    google: {},

    set: function( arg )
    {
        Options.font_size = arg.font_size;
        
        // excite settings.
        eval( "var excite = " + arg.excite );
     
        Options.excite["use"] = excite["use"] == "true" ? true : false;
        Options.excite["shift_key"] = (excite["sc1"] == "Shift" || excite["sc2"] == "Shift") ? true : false;
        Options.excite["ctrl_key"] = (excite["sc1"] == "Ctrl" || excite["sc2"] == "Ctrl") ? true : false;
        Options.excite["alt_key"] = (excite["sc1"] == "Alt" || excite["sc2"] == "Alt") ? true : false;

        // google settings.
        eval( "var google = " + arg.google );

        Options.google["use"] = google["use"] == "true" ? true : false;
        Options.google["shift_key"] = (google["sc1"] == "Shift" || google["sc2"] == "Shift") ? true : false;
        Options.google["ctrl_key"] = (google["sc1"] == "Ctrl" || google["sc2"] == "Ctrl") ? true : false;
        Options.google["alt_key"] = (google["sc1"] == "Alt" || google["sc2"] == "Alt") ? true : false;
    }
}


window.Receiver = {
    message: function( arg )
    {
        if( arg.msgid == "options" ){
            Options.set( arg );
            addStyle(); // after options loaded.
        }
        else if( arg.msgid == "alc" ){
            var res = Parser.alc( arg.txt );
            if( !res.length ){
                System.translation();
            }
            else{
                PopUp.show( res );
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
                PopUp.show( res );
            }
        }
        else if( arg.msgid == "google" ){
            if( !arg.txt ){
                System.translation();
            }
            else{
                PopUp.show( Parser.google( arg.txt ) );
            }
        }
        else if( arg.msgid == "loading" ){
            PopUp.loading();
        }
        else if( arg.msgid == "error" ){
            PopUp.error( arg.errno );
        }
   }
}

function checkId( ev )
{
    if( ev.target.id == "fastlookup" ) return true;
    if( ev.target.parentNode ){
        var t = ev.target.parentNode;
        do{
            if( t.id == "fastlookup" ) return true;
        }while( t = t.parentNode );
    }
    return false;
}

function addStyle()
{
    var style;

    style = ['position: absolute',
             'max-height: 50%',
             '-webkit-box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.65)',
             '-webkit-border-radius: 7px',
             'overflow: auto',
             'z-index: 9998'];
    var fastlookup_top_css = "#fastlookup_top{" + style.join(";") + "}";
    
    style = ['border: 1px solid #000',
             'background: #fff',
             'display: block',
             'width: auto',
             'height: auto',
             'max-height: 50%',
             'color: #000',
             'font-size: '+Options.font_size+'px',
             'font-style: normal',
             'font-variant: normal',
             'font-weight: normal',
             'text-align: left',
             'padding:7px 7px 7px 7px',
             'margin:0 0 0 0',
             'z-index: 9998',
             '-webkit-box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.65)',
             '-webkit-border-radius: 7px',
             'overflow: auto',
             'opacity: .95'];
    var fastlookup_css = "#fastlookup{" + style.join(";") + "}";
    
    var s = document.createElement( "style" );
    var sc = document.createTextNode( fastlookup_top_css + fastlookup_css + " #fastlookup img{padding:0; margin:0; display:inline;} #fastlookup a{color:#000;}" );
    s.type = "text/css";
    s.appendChild( sc );
    document.getElementsByTagName( "head" )[0].appendChild( s )
}

// --- main ---

// Load options & add style.
Connection = chrome.extension.connect( {name:"fastlookup"} );
Connection.onMessage.addListener( Receiver.message );
Connection.postMessage( {msgid:"options"} );

// trigger.
document.addEventListener( "mouseup", function( ev ){
    if( !checkId( ev ) ){
        var txt = window.getSelection().toString();
        if( !txt || txt.match(/^\s+$/) || !System.chooseTranslator( ev ) ){
            return;
        }
        MousePos.set( ev );

        Connection = chrome.extension.connect( {name:"fastlookup"} );
        Connection.onMessage.addListener( Receiver.message );

        System.initialize( txt );
        System.translation();
    }
}, false );

document.addEventListener( "click", function( ev ){
    if( !checkId( ev ) ){
        PopUp.remove();
    }
}, false );

