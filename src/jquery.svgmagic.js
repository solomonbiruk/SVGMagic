﻿/*  This jQuery plugin replaces SVG images in HTML 'img' elements (and optionally CSS in background-images) with
    PNG replacement images.  This is accomplished by the use of a remote image replacement service.
    
    Copyright © 2013-2014 - Authors:
    
    * Dirk Groenen [Bitlabs Development - dirk@bitlabs.nl]            Original author
    
    * Craig Fowler [CSF Software Limited - craig@csf-dev.com]         Redesign and enhancements
    
    * Mark van Eijk [mark@vormkracht10.nl]                            Improvements to PHP converter script

    Version 2.4.4
    
    ---

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Replaces matched SVG images in HTML 'img' elements (and optionally CSS background-image properties) with PNG
 * replacement images, generated by a remote server/service API.
 * 
 * -------
 * Options
 * -------
 * * temporaryHoldingImage    [string] This is a URI to an image which will be used as a "holding" image for the SVG
 *                            replacements until the URI of the appropriate PNG replacement has been retrieved from the
 *                            remote server. If set to null (the default behaviour) then no holding image will be used.
 * 
 * * forceReplacements        [boolean] If set to true then SVGMagic will replace SVG images even when the web browser
 *                            reports that it has native SVG support. If set to false (the default behaviour) then
 *                            replacement will only be performed when the web browser does not natively support SVG
 *                            images.
 * 
 * * handleBackgroundImages   [boolean] If set to true then SVGMagic will inspect the CSS background-image property of
 *                            matched elements.  If the background image is an SVG then replacement will additionally
 *                            be performed upon the background image.  If set to false (the default behaviour) then no
 *                            attempt will be made to detect and replace CSS background images.
 * 
 *                            Note that even when this option is enabled, background images are only detected on matched
 *                            elements.  No DOM search is performed to discover background images on (for example) child
 *                            nodes.
 * 
 * * additionalRequestData    [object] This is an object representing key/value pairs of information to send to the
 *                            remote server as part of the request.  The default is an empty object (resulting in no
 *                            additional data being sent).
 * 
 *                            This option is affected by the deprecated options 'secure' and 'dumpcache'.  Presently,
 *                            in order to preserve backwards-compatibility, the keys 'secure' and 'dumpcache' will
 *                            be added to the request data if they are not already present.  The values of these keys
 *                            will contain the respective values of those deprecated options.
 * 
 *                            Additionally, the key 'svgsources' is reserved and will always be overwritten with an
 *                            array of the URIs to the SVG images to be replaced. For this reason, the key 'svgsources'
 *                            must not be used within the additional request data.
 * 
 * * postReplacementCallback  [function(replacedImages)] This is a callback function which is executed after all of the
 *                            image replacement URIs have been retrieved from the remote server and the replacements
 *                            have been performed.
 * 
 *                            The parameter passed to this callback is a JavaScript array of objects which have the
 *                            following structure:
 *                            {
 *                              element             [object] A reference to the jQuery element node upon which the image
 *                                                  replacement has been performed.
 * 
 *                              isBackground        [boolean] True if the the replacement was made upon a CSS
 *                                                  background-image.  Otherwise this is an HTML 'img' element.
 * 
 *                              originalUri         [string] The original URI of the SVG image which has been replaced.
 * 
 *                              replacementUri      [string] The URI of the PNG replacement image.
 *                            }
 * 
 * * remoteServerUri          [string] This is the URI to the remote server API endpoint which converts SVG images into
 *                            PNGs and returns the list of URIs to those PNG replacements.  It is set by default to:
 *                            http://svgmagic.bitlabs.nl/converter.php
 * 
 *                            If you wish to host your own image-conversion server script/service then replace this with
 *                            the URI of your own API endpoint.
 * 
 * * remoteRequestType        [string] This is the type of HTTP request which will be used to communicate with the
 *                            remote server/service endpoint. By default this is set to 'POST'. Be careful if hosting
 *                            a service which accepts HTTP GET requests, as it could be vulnerable to CSRF attacks.
 * 
 * * remoteDataType           [string] This is the data-type sent to and received from the remote server.  By default
 *                            this is set to 'json'.
 * 
 * * replacementUriCreator    [function(jQueryElement, originalUri, isBackground)] If provided, this option alters the
 *                            behaviour of SVGMagic, short-cutting out the initial call to the remote server, to
 *                            retrieve the URIs to the replacement PNG images.  This is suitable for use in specialised
 *                            scenarios when the creation of the URI for the PNG replacements may be accomplished
 *                            entirely in JavaScript.  The server hosting those replacement PNG images must also be
 *                            capable of serving the correct image with only a single GET URI (as the server will not
 *                            have been pre-notified of the path to the SVG source file).  As such, it is most likely to
 *                            be used in hosted applications on a single domain, in which server-side logic has been
 *                            created to serve pre-ordained PNG replacement images.
 * 
 *                            The parameters which this function receives are:
 *                            * [object] A reference to the jQuery object representing the HTML node on which the
 *                              replacement is to be made.
 *                            * [string] The URI of the original SVG image to be replaced.
 *                            * [boolean] True if the replacement is a CSS background-image, false if it is an HTML
 *                              image element.
 * 
 *                            The function (if present) must return a string.  This string indicates the URI to the
 *                            PNG replacement image.  If null is returned then the replacement is skipped and the
 *                            original SVG image is left in-place.
 * 
 *                            The default behaviour (in which this function is null/not-provided) uses a call to a
 *                            remote server/API endpoint containing a list of the URIs of the SVG images to be replaced,
 *                            The response is parsed for the URIs of the replacement PNG images. 
 * 
 * ------------------
 * Deprecated options
 * ------------------
 * * preloader                [string or boolean] This is the URI to an image file which is used as a "holding" image
 *                            for your SVG images while the PNG replacements load from the remote server.  If set to
 *                            boolean false (the default behaviour) then no such holding image is used.
 * 
 *                            DEPRECATED: Use 'temporaryHoldingImage' instead.  If 'temporaryHoldingImage' is set then
 *                            this option is ignored.
 * 
 * * testmode                 [boolean] If set to true then the SVG replacement will be forced on all browsers,
 *                            including those which report that they support SVG natively.  If set to false (the default
 *                            behaviour) then the SVG replacement will only be performed upon browsers which do not
 *                            support it natively.
 * 
 *                            DEPRECATED: Use 'forceReplacements' instead.
 * 
 * * secure                   [boolean] The value (true or false) of this option is passed to the remote SVG replacement
 *                            server as part of the HTTP POST parameters.  Whilst the server may honour it or not, it is
 *                            intended that if the value is true, then the remote server will return a series of HTTPS
 *                            URIs (for the PNG replacement images). If set to false (the default behaviour) then the
 *                            remote server should return HTTP (non-secured) URIs.
 * 
 *                            Regardless of the setting of this option - the initial call to the remote server will be
 *                            performed via unsecured HTTP.
 * 
 *                            DEPRECATED: Use 'additionalRequestData' instead, adding data which the server will
 *                            interpret in order to serve HTTPS image URIs.  The value of this option will be appended
 *                            to the additional request data before it is sent to the server.
 * 
 * * callback                 [function()] An optional callback function which executes once all of the PNG replacement
 *                            image URIs have been retrieved from the remote server and all of the SVG images have had
 *                            their URIs replaced.  This is not quite a callback which executes after the replacement
 *                            images have loaded.  If the value is set to false (the default behaviour) then no
 *                            additional callback is executed.  No parameters are passed to this callback.
 * 
 *                            DEPRECATED: Use 'postReplacementCallback' instead.  If 'postReplacementCallback' is set
 *                            then this option is ignored.
 * 
 * * backgroundimage          [boolean] If set to true then additional inspection will be performed upon all matched
 *                            elements in order to find a CSS background-image property.  If such a property is found
 *                            then it will be included in the replacement process.  If set to false (the default
 *                            behaviour) then no additional work will be performed to find background-images which are
 *                            SVG.
 * 
 *                            DEPRECATED: Use 'handleBackgroundImages' instead.
 * 
 * * dumpcache                [boolean] The value (true or false) of this option is passed to the remote SVG replacement
 *                            server as part of the HTTP POST parameters.  If set to true, then the server is requested
 *                            to clear any cached PNG copy of the replaced SVG image.  This will result in the remote
 *                            server re-generating the PNG replacement.  If set to false (the default behaviour) then
 *                            the remote server is expected to serve cached PNG replacement images where possible. 
 * 
 *                            DEPRECATED: Use 'additionalRequestData' instead, adding data which the server will
 *                            interpret as a request to drop its cache.  The value of this option will be appended
 *                            to the additional request data before it is sent to the server.
 */

(function($) {
    $.fn.svgmagic = function(givenOptions)
    {
        var
        defaultOptions = {
            // Deprecated options
            preloader:              false,
            testmode:               false,
            secure:                 false,
            callback:               false,
            backgroundimage:        false,
            dumpcache:              false,

            // Replacements for deprecated options
                temporaryHoldingImage:  null,
                forceReplacements:      false,
                handleBackgroundImages: false,
                additionalRequestData:  {},
                postReplacementCallback:null,

                // New options
                remoteServerUri:        'http://svgmagic.bitlabs.nl/converter.php',
                remoteRequestType:      'POST',
                remoteDataType:         'jsonp',
            // TODO: Implement this option
            replacementUriCreator:  null
        },
        untidyOptions = $.extend(defaultOptions, givenOptions),
        options = tidyOptions(untidyOptions),
        holdingImageTimeouts = {},
        matchedNodes = this,
        images = [],
        imgElementName = 'img',
        srcAttributeName = 'src',
        backgroundImagePropertyName = 'background-image',
        urlMatcher = /^url\(["']?([^"'()]+)["']?\)$/,
        svgExtension = /\.svg$/,
        svgDataUri = /^data:image\/svg\+xml/,
        holdingImageTimeoutDuration = 500;
    
        /**
         * The place where all magic starts
         */
        if(shouldPerformReplacement(options))
        {
            getReplacementUris(options, matchedNodes);
        }
    
        /**
         * Include JSON if it's not available in the browser
         */
        if (typeof JSON == 'undefined') {
            if(typeof JSON!=="object"){JSON={}}(function(){"use strict";function f(e){return e<10?"0"+e:e}function quote(e){escapable.lastIndex=0;return escapable.test(e)?'"'+e.replace(escapable,function(e){var t=meta[e];return typeof t==="string"?t:"\\u"+("0000"+e.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+e+'"'}function str(e,t){var n,r,i,s,o=gap,u,a=t[e];if(a&&typeof a==="object"&&typeof a.toJSON==="function"){a=a.toJSON(e)}if(typeof rep==="function"){a=rep.call(t,e,a)}switch(typeof a){case"string":return quote(a);case"number":return isFinite(a)?String(a):"null";case"boolean":case"null":return String(a);case"object":if(!a){return"null"}gap+=indent;u=[];if(Object.prototype.toString.apply(a)==="[object Array]"){s=a.length;for(n=0;n<s;n+=1){u[n]=str(n,a)||"null"}i=u.length===0?"[]":gap?"[\n"+gap+u.join(",\n"+gap)+"\n"+o+"]":"["+u.join(",")+"]";gap=o;return i}if(rep&&typeof rep==="object"){s=rep.length;for(n=0;n<s;n+=1){if(typeof rep[n]==="string"){r=rep[n];i=str(r,a);if(i){u.push(quote(r)+(gap?": ":":")+i)}}}}else{for(r in a){if(Object.prototype.hasOwnProperty.call(a,r)){i=str(r,a);if(i){u.push(quote(r)+(gap?": ":":")+i)}}}}i=u.length===0?"{}":gap?"{\n"+gap+u.join(",\n"+gap)+"\n"+o+"}":"{"+u.join(",")+"}";gap=o;return i}}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;if(typeof JSON.stringify!=="function"){JSON.stringify=function(e,t,n){var r;gap="";indent="";if(typeof n==="number"){for(r=0;r<n;r+=1){indent+=" "}}else if(typeof n==="string"){indent=n}rep=t;if(t&&typeof t!=="function"&&(typeof t!=="object"||typeof t.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":e})}}if(typeof JSON.parse!=="function"){JSON.parse=function(text,reviver){function walk(e,t){var n,r,i=e[t];if(i&&typeof i==="object"){for(n in i){if(Object.prototype.hasOwnProperty.call(i,n)){r=walk(i,n);if(r!==undefined){i[n]=r}else{delete i[n]}}}}return reviver.call(e,t,i)}var j;text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(e){return"\\u"+("0000"+e.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}})()
        }
    
        /**
         * Determines whether or not image replacements should be performed.
         * 
         * @return [boolean] True if SVG replacements should be made, false if not.
         */
        function shouldPerformReplacement(opts)
        {
            return opts.forceReplacements || typeof document.createElement('svg').getAttributeNS !== 'function';
        }
    
        /**
         * Builds and returns an array of all of the matched image elements and 'elements which require background-image
         * replacements'.  These objects contain a reference to the element, as well as the image URI.
         * 
         * @return [array] - an array of objects containing information about the images to be replaced.  See
         *         'buildImageReference' for a specification of the contained objects.
         */
        function buildImageList(opts, nodes)
        {
            var output = [];
      
            nodes.each(function() {
                var timeout, $this = $(this);

                if($this.attr(srcAttributeName))
                {
                    var result = buildImageReference($this.attr(srcAttributeName), $this, false);
                    if(result)
                    {
                        output.push(result);

                        if(opts.temporaryHoldingImage)
                        {
                            timeout = setTimeout(function() {
                                $this.attr(srcAttributeName, opts.temporaryHoldingImage);
                            }, holdingImageTimeoutDuration);

                            holdingImageTimeouts[output.length - 1] = timeout;
                        }
                    }
                }

                if(opts.handleBackgroundImages && $this.css(backgroundImagePropertyName) && $this.css(backgroundImagePropertyName) != 'none')
                {
                    var result = buildImageReference(urlMatcher.exec($this.css(backgroundImagePropertyName))[1], $this, true);
                    if(result)
                    {
                        output.push(result);
                    }
                }
            });
      
            return output;
        }
    
        /**
         * Builds a single image reference object, as would be returned as part of the array created by 'buildImageList'.
         * 
         * @return [object] An object containing information about a single SVG image to replace.
         */
        function buildImageReference(imageUri, element, isBackground)
        {
            var output = null;

            if(svgExtension.test(imageUri) || svgDataUri.test(imageUri))
            {
                var tempImage = new Image();
                tempImage.src = imageUri;

                output = {
                    element: element,
                    isBackground: isBackground,
                    originalUri: tempImage.src,
                    replacementUri: null
                };
            }

            return output;
        }
    
        /**
         * The core functionality of this plugin, which makes the call to the remote service endpoint with a collection of
         * SVG image URIs for which PNG replacements are required, and then proceeds to handle the result.
         */
        function getReplacementUris(opts, nodes)
        {
            var replacementFunction = opts.replacementUriCreator;
            images = buildImageList(opts, nodes);

            if(images.length > 0)
            {
                if(replacementFunction && typeof replacementFunction == 'function')
                {
                    for(var i = 0; i < images.length; i++)
                    {
                        var image = images[i];
                        image.replacementUri = replacementFunction(image.element, image.originalUri, image.isBackground);
                    }

                    performReplacements(opts);
                }
                else
                {
                    getReplacementUrisFromRemoteService(opts);
                }
            }
        }
    
        /**
         * Gets all of the replacement image URIs from a remote server using an API call.
         */
        function getReplacementUrisFromRemoteService(opts)
        {
            var
            sources = [],
            data = {};

            for(var i = 0; i < images.length; i++)
            {
                sources.push(images[i].originalUri);
            }

            $.extend(data, opts.additionalRequestData, { svgsources: sources });

            $.ajax({
                dataType: opts.remoteDataType,
                method: opts.remoteRequestType,
                url: opts.remoteServerUri,
                data: data,
                success: function(response) {
                    for(var i = 0; i < images.length; i++)
                    {
                        var
                        image = images[i],
                        responseUri = response.results[i].url;

                        image.replacementUri = responseUri;
                    }

                    performReplacements(opts);
                }
            });
        }
    
        /**
         * Performs image replacements using the result from the remote replacement service.
         */
        function performReplacements(opts)
        {
            for(var i = 0; i < images.length; i++)
            {
                var image = images[i], newUri = image.replacementUri;

                if(!newUri)
                {
                    continue;
                }
                else if(!image.isBackground)
                {
                    if(opts.temporaryHoldingImage)
                    {
                        clearTimeout(holdingImageTimeouts[i]);
                    }
                    image.element.attr(srcAttributeName, newUri);
                }
                else
                {
                    image.element.css(backgroundImagePropertyName, 'url("' + newUri + '")');
                }
            }

            if(opts.postReplacementCallback && typeof opts.postReplacementCallback == 'function')
            {
                opts.postReplacementCallback(images);
            }
        }
        
        /**
         * Tidies up an object containing options for this plugin.  Takes any deprecated options (where set) and writes
         * them into the equivalent replacement option.
         */
        function tidyOptions(originalOptions)
        {
            if(!originalOptions.temporaryHoldingImage && originalOptions.preloader && typeof originalOptions.preloader == 'string')
            {
                originalOptions.temporaryHoldingImage = originalOptions.preloader;
            }

            if(originalOptions.testmode && typeof originalOptions.testmode == 'boolean')
            {
                originalOptions.forceReplacements = true;
            }

            if(!originalOptions.postReplacementCallback && originalOptions.callback && typeof originalOptions.callback == 'function')
            {
                originalOptions.postReplacementCallback = function(replacedImages)
                {
                    originalOptions.callback();
                };
            }

            if(!originalOptions.additionalRequestData['secure'])
            {
                originalOptions.additionalRequestData.secure = originalOptions.secure;
            }
            if(!originalOptions.additionalRequestData['dumpcache'])
            {
                originalOptions.additionalRequestData.dumpcache = originalOptions.dumpcache;
            }

            return originalOptions;
        }

        // Return the original jQuery object, standard jQuery behaviour.
        return this;
    };
}(jQuery));
