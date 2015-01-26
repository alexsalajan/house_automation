;( function( $ ) {

    // Singleton created to avoid cluttering the global namespace
    var temperatureUnits = {
        useFahrenheit: false,    // property in which the current temperature unit is cached
        toFahrenheit: function (celsius) {    // function that converts Celsius degrees to Fahrenheit degrees
            return Math.round(celsius * 9 / 5 + 32);
        },
        updateTemperature: function(selector, value) { // function that displays the temperature value (always in Celsius degrees) received as a parameter inside the element identified by the selector parameter
            if (this.useFahrenheit) {
                $( selector ).text( this.toFahrenheit(value) + String.fromCharCode(176) + "F" ); // display temperature in Fahrenheit degrees
            } else {
                $( selector ).text( value + String.fromCharCode(176) + "C" ); // display temperature in Celsius degrees
            }
        }
    };
    
    // function that translates the element identified by the selector on the X axes, with the amount specified in the distance parameter
    var cssTranslateX = function (selector, distance) {
        $(selector).css({
            "-webkit-transform": "translateX(" + distance + ")",
            "-moz-transform": "translateX(" + distance + ")",
            "-ms-transform": "translateX(" + distance + ")",
            "-o-transform": "translateX(" + distance + ")",
            "transform": "translateX(" + distance + ")"
        });
    };
    
    $(function() { // Handler for .ready() called.
        "use strict";
        
        /* ==========================================================================
           Initialize the House Automation plugin
           ========================================================================== */
        $( "#control-panel-form" ).automate({
            houseLayoutURL: "house_layout",             // URL of JSON file containing the house layout (house image and windows positions)
            serverGetURL: "server",                     // URL used to communicate with the server for getting house data
            serverPostURL: "serverACK",                 // URL used to communicate with the server for posting house data after an input in the Control Panel changes
            visualizationContainer: ".main-content",    // the container in which the house visualization will appear
//          realTimeMonitoring: true,    // uncomment this line to activate realtime monitoring (make changes in the server file to see effects)
//          monitoringInterval: 1000,    // monitoring interval (default = 5 seconds),
            
            /*switchLight: function(event, data) {
                // handler for the event generated by switching a light on and off
                alert("Light " + $(event.currentTarget).attr("name") + " has been switched");
            }*/
            /*switchCurtains: function(event, data) {
                // handler for the event generated by switching curtains on and off
            }*/
            /*changeTemperature: function(event, data) {
                // handler for the event generated by changing the temperature
            }*/
        });
        
        /* ==========================================================================
           Style Control Panel form, using jQuery UI and jQuery Mobile
           ========================================================================== */
        // CONTROL PANEL ACCORDION
        // use jQuery UI accordion widget to style blocks in the Control Panel
        $(".accordion").accordion({
            heightStyle: "content"
        });
        
        // display radio buttons as flipswitches using jQuery Mobile
        $(".flipswitch").flipswitch();
        
        // TEMPERATURE SLIDER
        // use jQuery Mobile slider widget to style the temperature input
        $( ".temperature-slider" ).on( "slidestop", function( event, ui ) {
        	// when the user stops dragging the slider, set the hidden input value in order to send it to the server
        	var currentTemperature = parseInt($(this).val());    // get the current temperature in Celsius degrees
        	$("input[name=temperature]").val(currentTemperature).change();
        } );
        $(".temperature-slider").change(function () {
        	// while the user drags the slider handle, display the current temperature selected in a span tag in the control panel
        	var currentTemperature = parseInt($(this).val());    // get the current temperature in Celsius degrees
            temperatureUnits.updateTemperature( "span.temperature-indicator", currentTemperature ); // display current temperature in the current temperature units
        });
        $("input[name=temperature]").change(function () {
            // update the slider position, when the temperature is changed from outside (from the data passed in by the server)
            var value = $(this).val();
            $(".temperature-slider").val(value).trigger("change"); // change input field that the temperature slider is binded to, and trigger a change 
        });
        
        // TEMPERATURE UNITS
         $("input[name=temperature_units]").change(function() {
            var currentTemperature = parseInt($("input[name=temperature]").val());    // get the current temperature in Celsius degrees
            if($(this).val() == "fahrenheit") {
                temperatureUnits.useFahrenheit = true;    // set the temperature units cache
            } else {
                temperatureUnits.useFahrenheit = false;    // set the temperature units cache
            }
            temperatureUnits.updateTemperature( "span.temperature-indicator", currentTemperature ); // display current temperature in the current temperature units
        });
        
        // OPEN CONTROL PANEL WHEN PAGE LOADS
//        $( "#control-panel" ).panel( "open");
    });

} )( jQuery );