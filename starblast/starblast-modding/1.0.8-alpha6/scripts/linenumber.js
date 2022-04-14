/*global document */
(function() {
    var source = document.getElementsByClassName('prettyprint source linenums');
    var i = 0;
    var lineNumber = 0;
    var lineId;
    var lines;
    var totalLines;
    var anchorHash;

    if (source && source[0]) {
        anchorHash = document.location.hash.substring(1);
        lines = source[0].getElementsByTagName('li');
        totalLines = lines.length;

        for (; i < totalLines; i++) {
            lineNumber++;
            lineId = 'line' + lineNumber;
            lines[i].id = lineId;
            if (lineId === anchorHash) {
                lines[i].className += ' selected';
            }
        }
    }

    Array.from(document.getElementsByClassName("methods")).forEach(function (element) {
        var pai = element.parentNode,
            urlLink = pai.childNodes[0].href,
            local = document.location;
        var origin = local.origin;
        if (origin + local.pathname === pai.childNodes[0].href) {
            pai.childNodes[0].className = "makeit-blue";
            return;
        }
        pai.childNodes[1].className += " esconde-subitens";
    });

})();
