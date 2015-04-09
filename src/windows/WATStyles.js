"use strict"

var WAT;
var stylesConfig;
var getCustomCssFile, customCssFileLoadHandler, loadCustomCssFileString, customStylesFromFile, loadCustomStyleString, scriptString, cssString,
    addNavAppBarCustomColorStyles,
    logger = window.console;


// Public API
var self = {
    init: function (WATref) {
        if (!WAT) {
            WAT = WATref;
            stylesConfig = WAT.manifest.wat_styles || {};

            addNavAppBarCustomColorStyles();

            // Execute element hiding
            WAT.components.webView.addEventListener("MSWebViewDOMContentLoaded", loadCustomStyleString);

            if (stylesConfig.customCssFile) {
                getCustomCssFile();
            }
        }
    }
};

// Private Methods

getCustomCssFile = function () {
    var cssFile = "ms-appx://" + ((/^\//.test(stylesConfig.customCssFile)) ? "" : "/") + stylesConfig.customCssFile;

    logger.log("Getting custom css file from " + cssFile);

    var url = new Windows.Foundation.Uri(cssFile);
    Windows.Storage.StorageFile.getFileFromApplicationUriAsync(url)
        .then(
            customCssFileLoadHandler,
            function (err) {
                // log this error, but let things proceed anyway
                logger.error("Error getting custom css file", err);
            }
        );
};

customCssFileLoadHandler = function (file) {
    Windows.Storage.FileIO.readTextAsync(file)
        .then(
            function (text) {
                customStylesFromFile = text;
                WAT.components.webView.addEventListener("MSWebViewDOMContentLoaded", loadCustomCssFileString);
            },
            function (err) {
                // log this error, but let things proceed anyway
                logger.warn("Error reading custom css file", err);
            }
        );
};

loadCustomCssFileString = function () {
    var exec, scriptString;

    logger.log("injecting styles: ", customStylesFromFile.replace(/\r\n/gm, " "));

    scriptString = "var cssFileString = '" + customStylesFromFile.replace(/\r\n/gm, " ") + "';" +
        "var cssFileStyleEl = document.createElement('style');" +
        "document.body.appendChild(cssFileStyleEl);" +
        "cssFileStyleEl.innerHTML = cssFileString;";

    exec = WAT.components.webView.invokeScriptAsync("eval", scriptString);
    exec.start();
};

loadCustomStyleString = function () {
    var i, l, hiddenEls, exec,
        scriptString = "",
        cssString = "";

    if (stylesConfig.suppressTouchAction === true) {
        cssString += "body{touch-action:none;}";
    }

    if (stylesConfig.hiddenElements && stylesConfig.hiddenElements !== "") {
        hiddenEls = stylesConfig.hiddenElements;
        var elements = "";
        for (i = 0; i < hiddenEls.length - 1; i++) {
            elements += hiddenEls[i] + ",";
        }
        elements += hiddenEls[hiddenEls.length - 1];
        cssString += elements + "{display:none !important;}";
    }

    //custom css string to add whatever you want
    if (stylesConfig.customCssString) {
        cssString += stylesConfig.customCssString;
    }

    scriptString += "var cssString = '" + cssString + "';" +
        "var styleEl = document.createElement('style');" +
        "document.body.appendChild(styleEl);" +
        "styleEl.innerHTML = cssString;";

    exec = WAT.components.webView.invokeScriptAsync("eval", scriptString);
    exec.start();
};

addNavAppBarCustomColorStyles = function () {
    var navBarScript = "";

    var appBar = WAT.manifest.wat_appBar;
    if (appBar) {
        var appBarBackColor = appBar.backgroundColor;
        var appBarButtonColor = appBar.buttonColor;

        if (appBarBackColor || appBarButtonColor) {
            /*App Bar custom colors*/

            navBarScript += ".win-appbar.win-bottom.customColor {\n";
            if (appBarBackColor) {
                navBarScript += "background-color: " + appBarBackColor + ";\n";
            }

            navBarScript += "}\n" +
                ".customColor .win-commandimage{\n";

            if (appBarButtonColor) {
                navBarScript += "color: " + appBarButtonColor + ";\n";
            }

            navBarScript += "}\n" +
                ".customColor button:active .win-commandimage, \n" +
                ".customColor button:enabled:hover:active .win-commandimage.win-commandimage{ \n";

            if (appBarBackColor) {
                navBarScript += "color: " + appBarBackColor + " !important;\n";
            }
            else {
                if (appBarButtonColor) {
                    navBarScript += "color: inherit;\n";
                }
            }

            navBarScript += "}\n" +
                "html.win-hoverable .customColor button:enabled:hover .win-commandimage,\n" +
                "html.win-hoverable .customColor button[aria-checked=true]:enabled:hover .win-commandimage {\n";

            if (appBarButtonColor) {
                navBarScript += "color: " + appBarButtonColor + ";\nopacity: .75;\n";
            }

            navBarScript += "}\n" +
                ".customColor .win-commandring {\n";

            if (appBarButtonColor) {
                navBarScript += "border-color: " + appBarButtonColor + ";\n";
            }

            navBarScript += "}\n" +
                ".customColor button:active .win-commandring, \n" +
                ".customColor button:enabled:hover:active .win-commandring.win-commandring{\n";

            if (appBarButtonColor) {
                navBarScript += "background-color: " + appBarButtonColor + ";\nborder-color: " + appBarButtonColor + ";\n";
            }

            navBarScript += "}\n" +
                ".customColor button:enabled:hover .win-commandring{\n";
            if (appBarButtonColor) {
                navBarScript += "border-color: " + appBarButtonColor + " !important;\n";
            }
            if (appBarBackColor) {
                navBarScript += "opacity: .75;\n";
            }

            navBarScript += "}\n" +
                ".customColor .win-label {\n";

            if (appBarButtonColor) {
                navBarScript += "color: " + appBarButtonColor + ";\n";
            }

            navBarScript += "}\n" +
                ".customColor.win-appbar button:enabled.win-appbar-invokebutton.win-appbar-invokebutton .win-appbar-ellipsis,\n" +
                ".customColor .submenu{\n";

            if (appBarButtonColor) {
                navBarScript += "color: " + appBarButtonColor + ";\n";
            }

            navBarScript += "}";
        }
    }

    if (navBarScript != "") {
        var cssFileStyleEl = document.createElement('style');
        document.head.appendChild(cssFileStyleEl);
        cssFileStyleEl.innerHTML = navBarScript;
    }
}

module.exports = self; // exports
