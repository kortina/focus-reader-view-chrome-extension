// content.js has access to DOM

// background.js:chrome.pageAction.onClicked calls this function
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    //console.log("unsubscribe-button:content.js:onRequest");
    enterFocusReader();
});

function enterFocusReader() {
  console.log('enterFocusReader');
  focusReaderMain();
  return;
    var topButton = getGmailUnsubscribeTopButton();
    if (topButton) {
        console.log("unsubscribe-button:topButton found");
        clickGmailUnsubscribeButtons(topButton);
        unsubSuccess();
    } else {
        console.log("unsubscribe-button:topButton NOT found");
        openBestUnsubLinkInEmailBody();
    }
}




function causeEventToFire(element, eventType){
    if (element.fireEvent) {
        element.fireEvent('on' + eventType);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(eventType, true, false);
        element.dispatchEvent(evObj);
    }
}



// Use ctrl+shift+o as a keyboard shortcut you can use instead of clicking
// button in address bar
function unsubscribeKeyboardShortcutListener(e) {
    console.log(e);
    if (e.ctrlKey && e.shiftKey && e.keyCode ==  79) {
        enterFocusReader();
    }
}

function registerFocusReaderShortcutListener(reregister) {
    console.log('registerFocusReaderShortcutListener');
    if (!reregister && unsubscribeKeyboardShortcutListener.isSet === true) return;
    document.addEventListener('keyup', unsubscribeKeyboardShortcutListener, false);
    unsubscribeKeyboardShortcutListener.isSet = true;
}

registerFocusReaderShortcutListener(false);

var readabilityVersion = "3";
var readStyle='style-ebook';
var readSize='size-large';
var readWidth='ems';
function focusReaderMain(){
  // removing all existing scripts so they don't cause conflicts...
  var docscripts = document.getElementsByTagName('script');
  for (k=0;k < docscripts.length; k++) {
    if (docscripts[k].src != null && ! docscripts[k].src.match(/readability|[Cc]lippability/)) {
      docscripts[k].parentNode.removeChild(docscripts[k]);
    }
  }

  console.log("jauery version");
  console.log($.fn.jquery);

  $('script').each(function(){
    // jQuery gets scripts inside of conditional comments far more easily than I could figure out
    if (! this.src.match(/readability|[Cc]lippability|jquery\.min\.js$/)) { $(this).remove(); }
  });


  var objOverlay = document.createElement("div");
  var objinnerDiv = document.createElement("div");

  objOverlay.id = "readOverlay";
  objinnerDiv.id = "readInner";

  // Apply user-selected styling:
  document.body.className = readStyle;
  objOverlay.className = readStyle;
  objinnerDiv.className = readWidth + " " + readSize;

  objinnerDiv.appendChild(grabArticle());		// Get the article and place it inside the inner Div
  objOverlay.appendChild(objinnerDiv);		// Insert the inner div into the overlay

  // For totally hosed HTML, add body node that can't be found because of bad HTML or something.
  if(document.body == null)
  {
    body = document.createElement("body");
    document.body = body;
  }

  document.body.innerHTML = "";

  // Inserts the new content :

  document.body.insertBefore(objOverlay, document.body.firstChild);
  var o = document.body.firstChild;
  return o.innerHTML;
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
  var articleFooter = document.createElement("DIV");

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
    topDiv.innerHTML = 'Sorry, clippable was unable to parse this page for content. If you feel like it should have been able to, please <a href="http://brettterpstra.com/contact">let us know.</a>';
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
  articleFooter.id = "readFooter";
  articleFooter.innerHTML = "<a href='https://kortina.net/'>kortina.net</a>mod of readability";

  articleContent.appendChild(topDiv);
  //	articleContent.appendChild(articleFooter);
  document.onkeyup = docOnKeyup;
  return articleContent;
}

function docOnKeyup(ev)
{
  var keyID = null;
  if (navigator.appName == "Microsoft Internet Explorer") {
    keyID = event.keyCode;
  } else {
    keyID = (window.event) ? event.keyCode : ev.keyCode;
  }
  var bgcolor,fgcolor,acolor;
  switch (keyID) {
    case 27: // escape
      document.location.reload(true);
      break;
    case 37: // left arrow
      bgcolor = "#222";
      fgcolor = "#F3EFCE";
      acolor = "#A19F89";
      break;
    case 39: // right arrow
      bgcolor = "#fff";
      fgcolor = "#333";
      acolor = "#276F78";
      break;
    case 46: // delete
      bgcolor = "#eee";
      fgcolor = "#333";
      acolor = "#blue";
      break;		
  }
  body = document.getElementById("readOverlay");
  // body.className = body.className.replace('/\blightened\b/','') + " darkened";
  body.style.backgroundColor = bgcolor;
  body.style.color = fgcolor;
  var alinks = body.getElementsByTagName('a');
  for (var lc = 0;lc < alinks.length;lc++) {
    alinks[lc].style.color = acolor;
  }	
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
