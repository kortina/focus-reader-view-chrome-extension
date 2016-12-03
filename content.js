// content.js has access to DOM
var FocusReader = {};
FocusReader.readabilityVersion = "3";
FocusReader.readStyle='style-ebook';
FocusReader.readSize='size-large';
FocusReader.readWidth='ems';

// background.js:chrome.pageAction.onClicked calls this function
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  FocusReader.enter();
});

FocusReader.enter = function() {
  console.log('FocusReader.enter');
  focusReaderMain();
}
// Use ctrl+shift+o as a keyboard shortcut you can use instead of clicking
// button in address bar
FocusReader.keyboardShortcutListener = function(e) {
  if (e.ctrlKey && e.shiftKey && e.keyCode ==  79) {
    FocusReader.enter();
  }
}

FocusReader.registerShortcutListener = function(reregister) {
  // console.log('FocusReader.registerShortcutListener');
  if (!reregister && FocusReader.keyboardShortcutListener.isSet === true) return;
  document.addEventListener('keyup', FocusReader.keyboardShortcutListener, false);
  FocusReader.keyboardShortcutListener.isSet = true;
}

FocusReader.registerShortcutListener(false);

function focusReaderMain(){
  console.log('focusReaderMain');
  var scripts = document.getElementsByTagName('script');
  for (k=0;k < scripts.length; k++) {
    if (scripts[k].src != null && ! scripts[k].src.match(/readability|[Cc]lippability/)) {
      scripts[k].parentNode.removeChild(scripts[k]);
    }
  }

  $('script').each(function(){
    if (! this.src.match(/readability|[Cc]lippability|jquery\.min\.js$/)) { $(this).remove(); }
  });

  var overlay = document.createElement("div");
  var inner = document.createElement("div");
  overlay.id = "readOverlay";
  inner.id = "readInner";

  document.body.className = FocusReader.readStyle;
  overlay.className = FocusReader.readStyle;
  inner.className = FocusReader.readWidth + " " + FocusReader.readSize;

  inner.appendChild(grabArticle());
  overlay.appendChild(inner);

  if(document.body == null) {
    body = document.createElement("body");
    document.body = body;
  }
  document.body.innerHTML = "";

  document.body.insertBefore(overlay, document.body.firstChild);
  return document.body.firstChild.innerHTML;
};

function getElementsByClassName(classname, node)  {
  if(!node) node = document.getElementsByTagName("body")[0];
  var a = [];
  var re = new RegExp('\\b' + classname + '\\b');
  var els = node.getElementsByTagName("*");
  for(var i=0,j=els.length; i<j; i++) {
    if(re.test(els[i].className))a.push(els[i]);
  }
  return a;
}

function grabArticle() {
  var allParagraphs = document.getElementsByTagName("p");
  var topDivCount = 0;
  var topDiv = null;
  var topDivParas;

  var articleContent = document.createElement("DIV");
  var articleTitle = document.createElement("H1");
  var articleBanner = document.createElement("DIV");

  // Replace all doubled-up <BR> tags with <P> tags, and remove fonts.
  var pattern =  new RegExp ("<br/?>[ \r\n\s]*<br/?>", "g");
  document.body.innerHTML = document.body.innerHTML.replace(pattern, "</p><p>").replace(/<\/?font[^>]*>/g, '');

  // Grab the title from the <title> tag and inject it as the title.
  articleTitle.innerHTML = document.title;
  articleContent.appendChild(articleTitle);

  // Study all the paragraphs and find the chunk that has the best score.
  // A score is determined by things like: Number of <p>'s, commas, special classes, etc.
  for (var j=0; j	< allParagraphs.length; j++) {
    parentNode = allParagraphs[j].parentNode;

    // Initialize readability data
    if(typeof parentNode.readability == 'undefined')
    {
      parentNode.readability = {"contentScore": 0};			

      // Look for a special classname
      if(parentNode.className.match(/(comment|meta|footer|footnote)/))
        parentNode.readability.contentScore -= 50;
      else if(parentNode.className.match(/((^|\\s)(post|hentry|entry[-]?(content|text|body)?|article[-]?(content|text|body)?)(\\s|$))/))
        parentNode.readability.contentScore += 25;

      // Look for a special ID
      if(parentNode.id.match(/(comment|meta|footer|footnote)/))
        parentNode.readability.contentScore -= 50;
      else if(parentNode.id.match(/^(post|hentry|entry[-]?(content|text|body)?|article[-]?(content|text|body)?)$/))
        parentNode.readability.contentScore += 25;
    }

    // Add a point for the paragraph found
    if(getInnerText(allParagraphs[j]).length > 10)
      parentNode.readability.contentScore++;

    // Add points for any commas within this paragraph
    parentNode.readability.contentScore += getCharCount(allParagraphs[j]);
  }

  // Assignment from index for performance. See http://www.peachpit.com/articles/article.aspx?p=31567&seqNum=5 
  for(nodeIndex = 0; (node = document.getElementsByTagName('*')[nodeIndex]); nodeIndex++) {
    if(typeof node.readability != 'undefined' && (topDiv == null || node.readability.contentScore > topDiv.readability.contentScore))
      topDiv = node;
  }
  if(topDiv == null)
  {
    topDiv = document.createElement('div');
    topDiv.innerHTML = 'Focus Reader was unable to parse this page for content. Report issues <a href="https://github.com/kortina/focus-reader-view-chrome-extension/issues">here</a>.';
  }

  // REMOVES ALL STYLESHEETS ...
  for (var k=0;k < document.styleSheets.length; k++) {
    if (document.styleSheets[k].href != null && document.styleSheets[k].href.lastIndexOf("readability") == -1) {
      document.styleSheets[k].disabled = true;
    }
  }

  var sh = getElementsByClassName("syntaxhighlighter");
  for (var i=0;i < sh.length;i++) {
    var bar = getElementsByClassName("toolbar",sh[i]);
    if (bar.length > 0) { 
      for (var bn=0;bn < bar.length;bn++) {
        bar[bn].parentNode.removeChild(bar[bn]); 
      }
    }
    var numbers = getElementsByClassName("number",sh[i]);
    if (numbers.length > 0) {
      for (var num=0;num < numbers.length;num++) {
        numbers[num].parentNode.removeChild(numbers[num]);
      }
    }
  }

  var dp = getElementsByClassName("dp-highlighter");
  for (var d=0;d < dp.length;d++) {
    dp[d].parentNode.removeChild(dp[d]); 
  }

  var sth = getElementsByClassName("standardLighter");
  for (d=0;d < sth.length;d++) {
    sth[d].parentNode.removeChild(sth[d]); 
  }

  // Remove all style tags in head (not doing this on IE) :
  var styleTags = document.getElementsByTagName("style");
  for (var l=0;l < styleTags.length; l++) {
    if (navigator.appName != "Microsoft Internet Explorer")
      styleTags[l].textContent = "";
  }
  topDiv = killCodeSpans(topDiv);			// removes span tags
  cleanStyles(topDiv);					// Removes all style attributes
  topDiv = killDivs(topDiv);				// Goes in and removes DIV's that have more non <p> stuff than <p> stuff
  topDiv = killBreaks(topDiv);            // Removes any consecutive <br />'s into just one <br /> 

  // Cleans out junk from the topDiv just in case:
  topDiv = clean(topDiv, "form");
  // topDiv = clean(topDiv, "object");
  topDiv = clean(topDiv, "table", 8);
  topDiv = clean(topDiv, "h1");
  // topDiv = clean(topDiv, "h2");
  topDiv = clean(topDiv, "iframe");


  // Add the footer and contents:
  articleBanner.id = "focusreader-banner";
  articleBanner.innerHTML = "<a href='https://kortina.net/'>kortina.net</a> mod of readability";

  articleContent.appendChild(topDiv);
  articleContent.insertBefore(articleBanner, articleContent.firstChild);
  return articleContent;
}

// Get the inner text of a node - cross browser compatibly.
function getInnerText(e) {
  if (navigator.appName == "Microsoft Internet Explorer")
    return e.innerText;
  else
    return e.textContent;
}

// Get character count
function getCharCount ( e,s ) {
  s = s || ",";
  return getInnerText(e).split(s).length;
}

function cleanStyles( e ) {
  e = e || document;
  var cur = e.firstChild;

  // If we had a bad node, there's not much we can do.
  if(!e)
    return;

  // Remove any root styles, if we're able.
  if(typeof e.removeAttribute == 'function')
    e.removeAttribute('style');

  // Go until there are no more child nodes
  while ( cur != null ) {
    if ( cur.nodeType == 1 ) {
      // Remove style attribute(s) :
      cur.removeAttribute("style");
      cleanStyles( cur );
    }
    cur = cur.nextSibling;
  }
}

function killDivs ( e ) {
  var divsList = e.getElementsByTagName( "div" );
  var curDivLength = divsList.length;

  // Gather counts for other typical elements embedded within.
  // Traverse backwards so we can remove nodes at the same time without effecting the traversal.
  for (var i=curDivLength-1; i >= 0; i--) {
    var p = divsList[i].getElementsByTagName("p").length;
    var img = divsList[i].getElementsByTagName("img").length;
    var li = divsList[i].getElementsByTagName("li").length;
    var a = divsList[i].getElementsByTagName("a").length;
    var embed = divsList[i].getElementsByTagName("embed").length;
    var object = divsList[i].getElementsByTagName("object").length;
    var pre = divsList[i].getElementsByTagName("pre").length;
    var code = divsList[i].getElementsByTagName("code").length;
    var divId = divsList[i].id;
    var divClass = divsList[i].className;
    var sphereit = divsList[i].innerHTML.match("<!-- sphereit") == null ? 0 : 1;
    // If the number of commas is less than 10 (bad sign) ...
    if ( getCharCount(divsList[i]) < 10 ) {
      // And the number of non-paragraph elements is more than paragraphs 
      // or other ominous signs : 
      if (( img > p || li > p || a > p || p == 0 || divId.match("comment") != null || divClass.match("comment") != null || divId.match("share") != null || divClass.match("share") != null) && ( pre == 0 && code == 0 && embed == 0 && object == 0 && sphereit == 0 )) {
        if (!p == 0 && img == 1) { divsList[i].parentNode.removeChild(divsList[i]); }
      } 
    }
    var stopwords = ['comment','share','footer','^ad'];
    for (var sw = 0;sw<stopwords.length;sw++) {
      regex = new RegExp(stopwords[sw]);
      if (divId.match(regex) != null || divClass.match(regex) != null) {
        console.log('matched '+stopwords[sw]);
        divsList[i].parentNode.removeChild(divsList[i]);
      }
    }
    // if (divId.match("comment") != null || divClass.match("comment") != null || divId.match("share") != null || divClass.match("share") != null || divClass.match("footer") != null || divId.match("footer") != null || divClass.match(/^ad/) != null || divId.match(/^ad/) != null) {
    //    divsList[i].parentNode.removeChild(divsList[i]);
    // }
  }	
  return e;
}

function killBreaks ( e ) {
  e.innerHTML = e.innerHTML.replace(/(<br\s*\/?>(\s|&nbsp;?)*){1,}/g,'<br />');
  return e;
}

function killCodeSpans ( e ) {
  e.innerHTML = e.innerHTML.replace(/<\/?\s?span(?:[^>]+)?>/g,"");
  return e;
}

function clean(e, tags, minWords) {
  var targetList;
  var y;
  if (tags == "table") {
    targetList = e.getElementsByTagName( tags );
    minWords = minWords || 1000000;
    for (y=0; y < targetList.length; y++) {
      // If the text content isn't laden with words, remove the child:
      cells = targetList[y].getElementsByTagName('td').length;
      if (cells < minWords) {
        targetList[y].parentNode.removeChild(targetList[y]);
      }
    }
  } else {
    targetList = e.getElementsByTagName( tags );
    minWords = minWords || 1000000;

    for (y=0; y < targetList.length; y++) {
      // If the text content isn't laden with words, remove the child:
      if (getCharCount(targetList[y], " ") < minWords && targetList[y].tagName != 'pre') {
        targetList[y].parentNode.removeChild(targetList[y]);
      }
    }
  }
  return e;
}

function convert(e,tagId){
  var children,parent,newNode;
  var elems = document.getElementsByTagName(tagId);
  for (y=0; y < elems.length; y++) {
    children = elems[y].childNodes;
    parent = elems[y].parentNode;
    newNode = document.createElement("span");
    newNode.setAttribute("style","font-weight:bold");
    for(var i=0;i<children.length;i++){
      newNode.appendChild(children[i]);
    }
    parent.replaceChild(newNode,elems[y]);		
  }
  return e;
}
