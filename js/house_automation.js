﻿;(function ( $, window, document, undefined ) {
    "use strict";

    /* ==========================================================================
       Create stateful jQuery plugin using the “Complete” Widget Factory Design Pattern
       ========================================================================== */
    // Dependencies: jQuery UI Widget Factory
    $.widget( "house.automate", { // the widget definition, where "house" is the namespace, and "automate" is the widget name
        // default options
        options: {
            houseLayoutURL: null,                       // URL of JSON file containing the house layout (house image and windows positions)
            serverGetURL: null,                         // URL used to communicate with the server for getting house data
            serverPostURL: null,                        // URL used to communicate with the server for posting house data after an input in the Control Panel changes
            visualizationContainer: null,               // the container in which the house visualization will appear
            thermometerImage: "img/thermometer.svg",    // the image used to display the thermometer
            realTimeMonitoring: false,                  // if true, the application will monitor any outside to the server data, on a fixed interval (useful if multiple users have access to the same house)
            monitoringInterval: 5000,                   // monitoring interval in milliseconds (used if option "realTimeMonitoring" is true)
            lightSwitchClass: "light-switch",           // class used to identify a checkbox in the Control Panel form that handles light switching
            curtainSwitchClass: "curtain-switch",       // class used to identify a checkbox in the Control Panel form that handles curtain switching
            temperatureName: "temperature",             // the temperature input name attribute
            temperatureUnitsName: "temperature_units",  // the temperature units input name attribute
 
            // callbacks
            switchLight: null,          // handler for the event generated by switching a light on and off
            switchCurtains: null,       // handler for the event generated by switching curtains on and off
            changeTemperature: null     // handler for the event generated by changing the temperature
        },
        
        /* ==========================================================================
           BEGIN Drawing the house
           ========================================================================== */
        // private function that parses the JSON file found at the houseLayoutURL to get the house image and window positions
        // and displays the house
        _drawHouse: function (houseLayoutURL, visualizationContainer, thermometerImage) {
            
            // definition of the window "object", used by the _drawHouse method in order to style the house windows
            // this implements the Constructors With Prototypes design pattern
            function Window ( top, left, width, height, windowClass ) {
                this.top = top;          // position-top value
                this.left = left;        // position
                this.width = width;      // window width
                this.height = height;    // window height
                this.windowClass = windowClass;    // string containing the window class(es)
            }
            Window.prototype.styleWindow = function () {
                var window =  $( "<div>", { "class": this.windowClass }).css({ // create a div with the given class and apply the styles to it
                    top: this.top,
                    left: this.left,
                    width: this.width,
                    height: this.height
                });
                return window;
            };
            
            // Getting the data (house image, and window positions) from the server
            $.get(houseLayoutURL, function (receivedData) {
                // === BEGIN catch errors in the JSON file ===
                // The request will usually fail silently if the JSON file has errors
                // since I wrote the JSON file manually, I chose to check for errors myself, instead of using the getJSON() function directly 
                if( !receivedData || receivedData === ""){    // The data in the JSON file is missing
                    console.error("ERROR: JSON data is missing");    // Print error message in the console
                    return;
                }
                var parsedData;
                try {
                    parsedData = $.parseJSON(receivedData);
                } catch (e) {    // There is an error in the JSON file
                    console.error("ERROR: JSON data is corrupted");    // Print error message in the console
                    return;
                }

                // create the code to be added to the visualizationContainer, replacing the widget options (house and thermometer images source attribute)
                var visualizationWrapper = $('<div class="ha-visualization-wrapper">' +
                                                '<figure class="ha-visualization ha-house-visualization">' +
                                                    '<div class="ha-drawing">' +
                                                        '<img class="ha-house" alt="House visualization" src="' + parsedData.house_view_src + '">' +
                                                    '</div>' +
                                                    '<figcaption>House visualization</figcaption>'+
                                                '</figure>' +
                                                '<figure class="ha-visiualization ha-temperature-visualization">' +
                                                    '<div class="ha-drawing">' +
                                                        '<div class="ha-quicksilver-container">' +
                                                            '<div class="ha-quicksilver"></div>' +
                                                        '</div>' +
                                                        '<img class="ha-thermometer" alt="Temperature" src="' + thermometerImage + '">' +
                                                    '</div>' +
                                                    '<figcaption>Temperature</figcaption>' +
                                                '</figure>' +
                                            '</div>');
                var window;
                var windows = parsedData.windows;
                var length = windows.length;    // cache vector length to increase performance
                for (var i=0; i<length; i++) {
                    // create the window DOM element
                    window = (new Window(windows[i].top, windows[i].left, windows[i].width, windows[i].height, "ha-window" + " " + windows[i].light_name + " " + windows[i].curtains_name)).styleWindow();
                    // and insert it before the house image
                    visualizationWrapper.find("img.ha-house").before(window);
                }
                // append the created HTML code to the visualizationContainer
                $(visualizationWrapper).appendTo( visualizationContainer );
            }, "text");
        },
        /* ==== END Drawing the house ==== */
        
        /* ==========================================================================
           BEGIN Getting data from server
           ========================================================================== */
        // private function that parses the JSON file found at the serverURL to get the status of the light, curtains and temperature
        // and adjusts the Control Panel form inputs accordingly
        _getDataFromServer: function (serverURL, controlPanel) {
        	var ha = this; // cache the widget instance, in order to make it available in the method below
            $.get(serverURL, function (receivedData) {
                // === BEGIN catch errors in the JSON file ===
                // The request will usually fail silently if the JSON file has errors
                // since I wrote the JSON file manually, I chose to check for errors myself, instead of using the getJSON() function directly 
                if( !receivedData || receivedData === ""){
                    console.error("ERROR: JSON data is missing"); // There is an error in the JSON file
                    return;
                }
                var parsedData;
                try {
                    parsedData = $.parseJSON(receivedData);
                } catch (e) {
                    console.error("ERROR: JSON data is corrupted"); // There is an error in the JSON file
                    return;
                }
                
                // for each checkbox in the Control Panel, get the checked property from the JSON data, and adjust it accordingly
                controlPanel.find("input[type=checkbox]").each( function() {
                    var inputName = $(this).attr("name");    // cache the input name attribute
                    if (parsedData[inputName] === "on") {    // lookup the name in the JSON data, and get the checked property
                        $(this).prop("checked", true).change();    // set checkbox as checked and trigger the "change" event
                    } else {
                        $(this).prop("checked", false).change();// set checkbox as not checked and trigger the "change" event
                    }
                });
                controlPanel.find("input[name=" + ha.options.temperatureName + "]").val(parsedData.temperature).change();    // set the temperature input value to the one in the JSON data and trigger the "change" event
                controlPanel.find("input[name=" + ha.options.temperatureUnitsName + "][value=" + parsedData.temperature_units + "]").prop("checked", true).change(); // adjust the temperature units radio buttons and trigger the "change" event
            }, "text");
        },
        /* ==== END Getting data from server ==== */
        
        // called when created, and later when changing options
        _refresh: function() {
            // synchronize with the server, every time the options change
            this._getDataFromServer(this.options.serverGetURL, this.element);
            
            if(this.timer) {
                // stop the timer, in case that the real time monitoring options have changed
                clearInterval(this.timer);
            }
            if (this.options.realTimeMonitoring) { // if real time monitoring is enabled
                var ha = this; // cache the widget instance, in order to make it available in the method below
                this.timer = setInterval( function () {    // set the interval for monitoring server changes
                    ha._getDataFromServer(ha.options.serverGetURL, ha.element);
                }, this.options.monitoringInterval);
            }
        },
        
        // function that handles visual effects of changes in the Control Panel
        // it also devides this changes into categories and triggers specific events: switchLight, switchCurtains or changeTemperature
        _handleEvent: function(event, data) {
            var input = $(event.target);           // get the input that generated the event
            var inputName = input.attr("name");    // cache input name

            switch (inputName) {
            case this.options.temperatureName:
                // the temperature is keept in Celsius degrees
                // the user can choose from a maximum of 86 values (40 negative + 1 zero + 45 positive)
                var percent = Math.round((parseInt(input.val()) + 40 + 1) * 100 / 86); // percent of the thermometer that is filled
                $("div.ha-quicksilver").css("height", percent + "%"); // visually display the temperature
                
                this._trigger( "changeTemperature", event, data );    // trigger a callback/event for a temperature change
                break;
            case this.options.temperatureUnitsName:
                // the only thing to do here is send data to the server (the temperature display in Celsius / Fahrenheit is handled in the main.js file)
                break;
            default:
                if (input.hasClass(this.options.lightSwitchClass)) {    // every checkbox that handle light switching, has to have the class "light-switch"
                    if (input.prop("checked")) {                        // if checkbox is checked
                        $(".ha-window." + inputName).addClass("ha-light");    // find the corresponding window and add the "light" class to it
                    } else {                                            // else
                        $(".ha-window." + inputName).removeClass("ha-light"); // remove class "light"
                    }

                    this._trigger( "switchLight", event, data );    // trigger a callback/event for switching a light
                } else if (input.hasClass(this.options.curtainSwitchClass)) { // every checkbox that handle light switching, has to have the class "curtain-switch"
                    if (input.prop("checked")) {                              // if checkbox is checked
                        $(".ha-window." + inputName).addClass("ha-curtains");       // find the corresponding window and add the "curtains" class to it
                    } else {                                                  // else
                        $(".ha-window." + inputName).removeClass("ha-curtains");    // remove class "curtains"
                    }

                    this._trigger( "switchCurtains", event, data );    // trigger a callback/event for switching curtains
                }
            }
        },

        // the constructor
        _create: function () {
            // if the required options are not set, print an error message in the console and abort
            if (!(this.options.houseLayoutURL && this.options.serverGetURL && this.options.serverPostURL && this.options.visualizationContainer)) {
                console.error("ERROR: Required options are not set!");
                return false;
            }
            
            $(this.options.visualizationContainer).addClass( "ha-house-automation" );    // add a class for theming
            // display the house
            this._drawHouse(this.options.houseLayoutURL, this.options.visualizationContainer, this.options.thermometerImage);
            
            var ha = this; // cache the widget instance, in order to make it available in the method below
            this._on( this.element.find("input"), {    // for every input inside the Control Panel form
                change: function( event ) {            // on change
                    var sentData = ha.element.serialize();    // serialize the form data, in order to send it to the server
                    $.post( this.options.serverPostURL, sentData, function( receivedData ) {    // send data to the server, via POST
                        // === BEGIN catch errors in the JSON file ===
                        // The request will usually fail silently if the JSON file has errors
                        // since I wrote the JSON file manually, I chose to check for errors myself, instead of using the getJSON() function directly 
                        if( !receivedData || receivedData === ""){
                            console.error("ERROR: JSON data is missing"); // There is an error in the JSON file
                            return;
                        }
                        var parsedData;
                        try {
                            parsedData = $.parseJSON(receivedData);
                        } catch (e) {
                            console.error("ERROR: JSON data is corrupted"); // There is an error in the JSON file
                            return;
                        }
                        // === END catch errors in the JSON file ===
                        // I assumed that after receiving the new value, the server should return an acknowledgement that the data has been processed. In this case, it returns "status: ok"
                        if ( parsedData.status === "ok" ) {
                            ha._handleEvent(event, ha);    // handle visual efects and trigger events
                        }
                    }, "text");
                }
            });
            
            this._refresh();
        },
        
        // _setOptions is called with a hash of all options that are changing
        _setOptions: function() {
            // _super and _superApply handle keeping the right this-context
            this._superApply( arguments );
            this._refresh();    // always refresh when changing options
        },
     
        // _setOption is called for each individual option that is changing
        _setOption: function( key, value ) {
            this._super( key, value );
        },
        
        // events bound via _on are removed automatically
        // other modifications are reverted here
        _destroy: function() {
            // remove generated elements
            $(this.options.visualizationContainer).find(".visualization-wrapper").remove();
            // remove added classes
            $(this.options.visualizationContainer).removeClass( "house-automation" );
            // stop real time monitoring if it was activated
            if (this.timer) {
                clearInterval(this.timer);
            }
        }
    });

})( jQuery, window, document );