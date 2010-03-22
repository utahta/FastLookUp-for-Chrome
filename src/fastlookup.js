var loading_img_url = chrome.extension.getURL("loadinfo.gif");

Connection = null; // chrome connection.
Utility = {
    createTag: function( txt, url )
    {
        var e = document.createElement( "div" );
        e.innerHTML = "by <a href='"+url+"' onclick='window.open(this.href, \"fastlookpop\"); return false;'>"+txt+"</a>";
        return e;
    },
    
    checkId: function( ev )
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

PopUp = {
    obj: null,
    
    initialize: function()
    {
        PopUp.remove();
        PopUp.obj = document.createElement( "div" );
        PopUp.obj.setAttribute( "id", "fastlookup_top" );
    },
    
    exist: function()
    {
        if( !PopUp.obj ){
        	return false;
        }
        return true;
    },

    remove: function()
    {
        if( !PopUp.exist() ){
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
            PopUp.notFound();
        }
        else{
            var msgid = this.msgid_list[this.index++];
            Connection.postMessage( {msgid:msgid, txt:this.txt} );
        }
    },

    /**
     * @brief 翻訳機を選択
     * @param ev イベントオブジェクト
     * @param is_word 単語単体だったら true.
     */
    chooseTranslator: function( ev, is_word )
    {
        // System setting.
        this.clear();
        
        // 最適化有効？
        if( Options.get('optimum') ){
        	// 有効なら単語単体の場合のみ excite を使用。
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
};

Style = {
	css: null,
	text_node: null,
		
	/**
	 * @brief スタイル追加
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
	 * @brief スタイル更新
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
	 * @brief スタイル文字列取得
	 * @note
	 * like private method.
	 */
	_getStyle: function()
	{
	    var style;
	    style = ['position: absolute',
	             'max-width: 70%',
	             'max-height: 50%',
	             '-webkit-box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.65)',
	             '-webkit-border-radius: 7px',
	             'padding:0',
	             'margin:0',
	             'overflow: auto',
	             'z-index: 9998'];
	    var fastlookup_top_css = "#fastlookup_top{" + style.join(";") + "}";
	    
	    style = ['border: 1px solid #000',
	             'background: ' + Options.get('background_color'),
	             'color: ' + Options.get('font_color'),
	             'font-family:'+ Options.get('font_family'),
	             'font-size: '+ Options.get('font_size') +'px',
	             'font-style: ' + Options.get('font_style'),
	             'opacity: ' + Options.get('opacity'),
	             'font-variant: normal',
	             'font-weight: normal',
	             'display: block',
	             'width: auto',
	             'height: auto',
	             'text-align: left',
	             'padding:7px 7px 7px 7px',
	             'margin:0',
	             'z-index: 9998',
	             '-webkit-box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.65)',
	             '-webkit-border-radius: 7px',
	             'overflow: auto'];
	    var fastlookup_css = "#fastlookup{" + style.join(";") + "}";
	    
	    var other_css = "#fastlookup img{padding:0; margin:0; display:inline; border:0; clear:both;}" +
						"#fastlookup a{color:#000; margin:0; padding:0;}" +
						"#fastlookup p{margin:5px; padding:0;}";
	    return fastlookup_top_css + fastlookup_css + other_css;
	}
};

// --- main ---
Style.add();

// Load options.
Connection = chrome.extension.connect( {name:"fastlookup"} );
Connection.onMessage.addListener( Receiver.message );
Connection.postMessage( {msgid:"options"} );

// trigger.
document.addEventListener( "mouseup", function( ev ){
    if( !Utility.checkId( ev ) ){
        var txt = window.getSelection().toString();
        // 空文字、空白のみ、ショートカット未選択だったら何もしない
        if( !txt || txt.match(/^\s+$/) || !System.chooseTranslator( ev, (txt.match(/^(\W+|)\S+(\W+|)$/) != null) ) ){
            return;
        }
        MousePos.set( ev );

        Connection = chrome.extension.connect( {name:"fastlookup"} );
        Connection.onMessage.addListener( Receiver.message );

        System.initialize( txt );
        System.translation();
    }
}, false );

document.addEventListener( "mousedown", function( ev ){
    if( !Utility.checkId( ev ) ){
    	if( PopUp.exist() ){
    		window.getSelection().removeAllRanges();
    		PopUp.remove();
    	}
    	System.clear();
    }
}, false );

