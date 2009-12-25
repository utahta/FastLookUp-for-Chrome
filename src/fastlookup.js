var loading_img_url = chrome.extension.getURL("loadinfo.gif");

window.Connection = null; // chrome connection.
window.Utility = {
    createTag: function( txt, url )
    {
        var e = document.createElement( "div" );
        e.innerHTML = "By <a href='"+url+"' onclick='window.open(this.href, \"fastlookpop\"); return false;'>"+txt+"</a>";
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
        res.push( Utility.createTag( "英辞郎 on the WEB", "http://www.alc.co.jp/" ) );
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
            // <a>タグはポップアップ表示に変換します
            var e = r.snapshotItem(i);
            e.innerHTML = e.innerHTML.replace( /<a/g, "<a onclick='window.open(this.href, \"fastlookpop\", \"menubar=no, toolbar=no\"); return false;'" );
            e.innerHTML = e.innerHTML.replace( /<img/g, "<img class='fastlookup_img'" );
            res.push( e );
            //res.push( r.snapshotItem(i) );
        }
        res.push( Utility.createTag( "excite翻訳", "http://www.excite.co.jp/world/" ) );
        return res;
    },
    
    google: function( txt )
    {
        var res = [];
        var e = document.createElement( "div" );
        e.innerHTML = txt;
        res.push( e );
        res.push( Utility.createTag( "google翻訳", "http://translate.google.co.jp/" ) );
        return res;
    },

    getSnapshot: function( exp, txt )
    {
        var e = document.createElement( "div" );
        e.innerHTML = txt;
        
        var resolver = function( prefix ){
            var r = document.createNSResolver(e)(prefix);
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
    }
}

window.PopUp = {
    obj: null,
    
    initialize: function()
    {
        PopUp.remove();
        PopUp.obj = document.createElement( "div" );
        var style = ['position: absolute',
                    'border: 1px solid #000',
                    'background: #fff',
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
        PopUp.obj.setAttribute( "style", style.join(";") );
        PopUp.obj.setAttribute( "id", "fastlookup" );
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
            res.forEach( function( e ){
                PopUp.obj.appendChild( e );
            });
            document.body.appendChild( PopUp.obj );
            PopUp.position();
        }
    },

    loading: function()
    {
        var res = [];
        var e = document.createElement( "div" );
        e.innerHTML = "<img src='"+loading_img_url+"' class='fastlookup_img'> 検索中...";
        res.push( e );
        PopUp.show( res );
    },

    error: function( errno )
    {
        var res = [];
        var e = document.createElement( "div" );
        e.innerHTML = "項目が見つかりませんでした";
        res.push( e );
        console.error( "errno:"+errno );
        PopUp.show( res );
    },

    notFound: function()
    {
        var res = [];
        var e = document.createElement( "div" );
        e.innerHTML = "項目が見つかりませんでした";
        res.push( e );
        PopUp.show( res );
    }
}

window.System = {
    txt: "",
    msgid_list: [],
    index: 0,
    
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
    }
}

window.Options = {
    font_size: 13,
    shift_key: false,
    ctrl_key: false,
    alt_key: false,

    set: function( arg ) 
    {
        Options.font_size = arg.font_size;
        if( arg.shortcut1 == "Shift" || arg.shortcut2 == "Shift" ){
            Options.shift_key = true;
        }
        if( arg.shortcut1 == "Ctrl" || arg.shortcut2 == "Ctrl" ){
            Options.ctrl_key = true;
        }
        if( arg.shortcut1 == "Alt" || arg.shortcut2 == "Alt" ){
            Options.alt_key = true;
        }
    }
}

window.Receiver = {
    message: function( arg )
    {
        if( arg.msgid == "options" ){
            Options.set( arg );
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

function checkKeys( ev )
{
    return ev.ctrlKey == Options.ctrl_key && ev.shiftKey == Options.shift_key && ev.altKey == Options.alt_key;
}

function addStyle()
{
    var s = document.createElement( "style" );
    var sc = document.createTextNode( ".fastlookup_img {padding:0; margin:0;}" );
    s.type = "text/css";

    if( s.styleSheet ){
        s.styleSheet.cssText = sc.nodeValue;
    }
    else{
        s.appendChild( sc );
        document.getElementsByTagName( "head" )[0].appendChild( s )
    }
}

// Add style.
addStyle();

// Load options.
Connection = chrome.extension.connect( {name:"fastlookup"} );
Connection.onMessage.addListener( Receiver.message );
Connection.postMessage( {msgid:"options"} );

// System setting.
//System.push( "alc" );         // alc. プラグインとして利用すると規約違反らしいので無効化
System.push( "excite_pre" );    // excite.
System.push( "google" );        // google.

// main & trigger.
document.addEventListener( "mouseup", function( ev ){
    if( !checkId( ev ) ){
        var txt = window.getSelection().toString();
        if( !txt || txt.match(/^\s+$/) || !checkKeys( ev ) ){
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

