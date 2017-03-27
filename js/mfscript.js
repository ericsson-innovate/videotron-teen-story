const TEST_WEATHER_URL = "resources/montreal-weather.json";
const WEATHER_URL = "http://52.207.31.245:5000/vsmarthome/v1/weather?lat=45.5580206&long=-73.7816015";


//=========================================
//Subscribe MQTT Events
//=========================================
var mqtt;
var presence_name;
var tesla_status = 88;
var t_tesla;//charging interval

function MQTTconnect() {
    mqtt = new Paho.MQTT.Client("52.207.31.245", 9001, "clientId");

    mqtt.onConnectionLost = onConnectionLost;
    mqtt.onMessageArrived = onMessageArrived;

    // connect the client
    mqtt.connect({onSuccess:onConnect});


}

function onConnect() {
    console.log("Connected");
    // Connection succeeded; subscribe to our topic
    // Connection succeeded; subscribe to our topic, you can add multile lines of these
    mqtt.subscribe('/World', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/wakeup', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/presence', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/tesla', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/coffee_maker', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/blinds', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/payment', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/weather_info', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/video', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/highlights', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/message', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/show_news', {qos: 1});
    mqtt.subscribe('/vsmarthome/notify/magazine', {qos: 1})
    mqtt.subscribe('/vsmarthome/notify/goodbye', {qos: 1});


    //use the below if you want to publish to a topic on connect
    message = new Paho.MQTT.Message("Hello");
    message.destinationName = "/World";
    mqtt.send(message);

}

function onConnectionLost(response) {
    console.log("Connection Lost", response);
    setTimeout(MQTTconnect, 2000);

};

/**
 * MQTT callback when a message has arrived through one of the channels
 */
function onMessageArrived(message) {
    console.log("Message arrived", message);
    var topic = message.destinationName;
    console.log("Topic", topic);
    var payload = message.payloadString;
    console.log("Payload", payload);

    //A wakeup mode has been detected
    if (topic == "/vsmarthome/notify/wakeup") {
        //Wakeup! Start brewing the coffee! And pull up the blinds!
        wakeup();
    }
    //A presence has been notified
    else if (topic == "/vsmarthome/notify/presence") {
        presence_name = payload;
        playWakeupSound();
        switchToDashboard();
    }
    //A change in the Tesla battery status has been notified
    else if (topic == "/vsmarthome/notify/tesla") {
        console.log("tesla payload", payload);
        if (payload == 100) {
            $("ul.icon-coffee  li:nth-child(2)").addClass("status-on")
        }
        else {
            $("ul.icon-tesla li:nth-child(2)").removeClass("status-on")
        }
        $(".tesla-status-placeholder").html(payload);
    }
    //A change in the coffee maker status has been notified
    else if (topic == "/vsmarthome/notify/coffee_maker") {
        console.log("coffee maker payload", payload);
        if (payload == "on") {
            $("ul.icon-coffee  li:nth-child(2)").addClass("status-on")
        }
        else {
            $("ul.icon-coffee li:nth-child(2)").removeClass("status-on")
        }
        $(".coffee-status-placeholder").html(payload.toUpperCase());
    }
    //A change in the blinds status has been notified
    else if (topic == "/vsmarthome/notify/blinds") {
        console.log("blinds payload", payload);
        if (payload == "on") {
            $("ul.icon-coffee  li:nth-child(2)").addClass("status-on")
        }
        else {
            $("ul.icon-coffee li:nth-child(2)").removeClass("status-on")
        }
        $(".coffee-status-placeholder").html(payload.toUpperCase());
    }
    //A payment has been notified
    else if (topic == "/vsmarthome/notify/payment") {
        console.log("payment", payload);
    }
    //A weather info notification has arrived
    else if (topic == "/vsmarthome/notify/weather_info") {
        console.log("weather info", payload);
    }
    //A video request notification has arrived
    else if (topic == "/vsmarthome/notify/video") {
        console.log("video", payload);
        $('#modal-fullscreen').modal('show');
    }
    else if (topic == "/vsmarthome/notify/highlights") {
        console.log("highlights, payload");
        //change the source to the requested game event
        $('#modal-fullscreen video source').attr('src', "video/habs.mp4");
        $("#modal-fullscreen video")[0].load();
        $('#modal-fullscreen').modal('show');

    }
    else if (topic == "/vsmarthome/notify/message") {
        console.log("message", payload);

        var message = payload.split("/");
        var text = message[0]
        var from = message[1];

        $(".message-from").html(from);
        $(".message-text").html(text);
        $('#incoming-message-modal').modal('show');

        setTimeout( function() {
            $('#incoming-message-modal').modal('hide');
        }, 3000);
    }
    else if (topic == "/vsmarthome/notify/show_news") {
        console.log("show news, payload");
        switchToMediaFirstX();
    }
    else if (topic == "/vsmarthome/notify/magazine") {
        console.log("show magazine, payload");
        switchToMediaFirstX();
    }
    else if (topic == "/vsmarthome/notify/goodbye") {
        //TODO
        console.log("goodbye", payload);
        //switch to the first screen

        $("#welcome-message .top-menubar").addClass("invisible");
        $("#first .standby-container .standby_time").removeClass("standby_time_wakeup");
        $("#first .standby-container .standby_alarm_events ul.icon-coffee").addClass("fadeout");
        $("#first .standby-container .standby_alarm_events ul.icon-blinds").addClass("fadeout");
        $("#first .standby-container .standby_alarm_events ul.icon-spotify").addClass("fadeout");

        switchToStandbyMode();
        triggerIFTTT("coffee_maker", "off");
        stopSpotify();
        //setting the Nest to "save energy mode"
        saveEnergy();
        playGoodbyeSound();

    }


};


$( document ).ready(function() {
    console.log( "ready!" );


    //display time
    $("#currentTime").html(getTime());
    $("#welcome-time").html(getTime());

    //display weather information
    var icons = new Skycons({"color": "white"});
    getWeather(icons);

    //Start ticking for time display and weather info
    var t = setInterval('tick()',60000);
    t_tesla = setInterval('chargeTesla()', 60000);

    /*
    $.when(getLesAffairesFeeds()).then(function (contentInfo) {
        console.log("Hello there");
        getTVASportsFeeds();
    });
    */

    //setup MQTT connection
    MQTTconnect();



    //=========================================
    // STANDBY AND WELCOME SCREEN EVENTS
    //=========================================
    //slowly fade in to the welcome
    $('#first').removeClass('fadeout');

    $("body").keydown(function(e) {
        // e.preventDefault(); // prevent the default action (scroll / move caret)
        switch(e.keyCode) {
            case 37: // left
                console.log("left");
                break;
            case 38: // up
                console.log("up");
                if (! $("#third").hasClass("hidden")) {
                    switchToDashboard();
                }
                break;
            case 39: // right
                console.log("right");
                break;
            case 40: // down
                console.log("down");
                if (! $("#first").hasClass("hidden") && $("#second").hasClass("hidden") && $("#third").hasClass("hidden")  ) {
                    switchToDashboard();
                }
                else if (! $("#second").hasClass("hidden")) {
                    switchToMediaFirstX();
                }
                break;
        }
    });



    //=========================================
    // LISTEN TO CLICK EVENTS
    //=========================================


    //TODO instead of a click it should be something else....
    //On clicking the Standby screen, switch to the dashboard
    $( "#first" ).click(function() {
        console.log( "Going to dashboard!" );
        switchToDashboard();
    });



    //=========================================
    //ALL THE MODAL FOR FULLSCREEN VIDEOS ARE
    // HAPPENING HERE
    //=========================================
    //On clicking the "Play Leolo Movie", do something
    $(".play-leolo-btn").click(function() {
        console.log("Play Leolo");
    });

    $(".modal-fullscreen").on('show.bs.modal', function () {
        setTimeout( function() {
            $(".modal-backdrop").addClass("modal-backdrop-fullscreen");
        }, 0);
        $("#video1").get(0).play();
    });

    $(".modal-fullscreen").on('hidden.bs.modal', function () {
        $("#video1").get(0).pause();
        $(".modal-backdrop").addClass("modal-backdrop-fullscreen");
    });
});



/**
 * Get the current time
 * @returns {string} Current time
 */
var getTime = function() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var now = h + ":"  + (m<10? "0" + m : m);
    return now;
}

var getWeather = function(skycons) {
    $.ajax({
        dataType: "json",
        url: TEST_WEATHER_URL,
        success: function(data) {
            console.log("Success", data);

            //get the "currently" data
            console.log("Temperature in F", data['currently']['temperature']);
            $(".temperature-placeholder").html(Math.round(FtoC(data['currently']['temperature'])));

            //get the sky status icon
            sky_status = data['currently']['icon'].toUpperCase();
            console.log ("Sky is ", sky_status);

            if (sky_status == ("CLEAR-DAY")) {
                skycons.set("weather-icon", Skycons.CLEAR_DAY);
                skycons.set("weather-icon-2", Skycons.CLEAR_DAY);
            }
            else if (sky_status == ("CLEAR-NIGHT")) {
                skycons.set("weather-icon", Skycons.CLEAR_NIGHT);
                skycons.set("weather-icon-2", Skycons.CLEAR_NIGHT);
            }
            else if (sky_status == "PARTLY-CLOUDY-DAY") {
                skycons.set("weather-icon", Skycons.PARTLY_CLOUDY_DAY);
                skycons.set("weather-icon-2", Skycons.PARTLY_CLOUDY_DAY);
            }
            else if (sky_status == "PARTLY-CLOUDY-NIGHT") {
                skycons.set("weather-icon", Skycons.PARTLY_CLOUDY_NIGHT);
                skycons.set("weather-icon-2", Skycons.PARTLY_CLOUDY_DAY);
            }
            else if (sky_status == "CLOUDY") {
                skycons.set("weather-icon", Skycons.CLOUDY);
                skycons.set("weather-icon-2", Skycons.PARTLY_CLOUDY_DAY);
            }
            else if (sky_status == "RAIN") {
                skycons.set("weather-icon", Skycons.RAIN);
                skycons.set("weather-icon-2", Skycons.PARTLY_CLOUDY_DAY);
            }
            else if (sky_status == "SLEET") {
                skycons.set("weather-icon", Skycons.SLEET);
                skycons.set("weather-icon-2", Skycons.PARTLY_CLOUDY_DAY);
            }
            else if (sky_status == "SNOW") {
                skycons.set("weather-icon", Skycons.SNOW);
                skycons.set("weather-icon-2", Skycons.PARTLY_CLOUDY_DAY);
            }
            else if (sky_status == "WIND") {
                skycons.set("weather-icon", Skycons.WIND);
                skycons.set("weather-icon-2", Skycons.PARTLY_CLOUDY_DAY);
            }
            else if (sky_status == "FOG") {
                skycons.set("weather-icon", Skycons.FOG);
                skycons.set("weather-icon-2", Skycons.PARTLY_CLOUDY_DAY);
            }

            //get the low and high temperature during the day
            var hourly_data = data['hourly']['data'];

            var low_temperature = Math.round(FtoC(hourly_data[0]['temperature']));
            var high_temperature = Math.round(FtoC(hourly_data[0]['temperature']));

            for (var i=0; i<hourly_data.length; i++) {
                var hourly_temperature = Math.round(FtoC(hourly_data[i]['temperature']));
                if (hourly_temperature < low_temperature) {
                    low_temperature = hourly_temperature;
                }

                if (hourly_temperature > high_temperature) {
                    high_temperature = hourly_temperature;
                }
            }

            $('.temperature-low-placeholder').html(low_temperature);
            $('.temperature-high-placeholder').html(high_temperature);

            //get the wind speed
            $('.wind-placeholder').html(data['currently']['windSpeed']);

            //get the humidity factor
            $('.humidity-placeholder').html(data['currently']['humidity']*100);

        }

    });
}

/**
 * Convert Fahrenheit to Celsius
 * @param f
 * @returns {number}
 * @constructor
 */
var FtoC = function (f) {
    return (5/9) * (f-32);
}

/**
 * Switch to the Standby screen
 */
var switchToStandbyMode = function() {
    console.log("switchToStandbyMode")

    //hide the first screen
    $("html").addClass("full");
    $(".fullscreen-bg").addClass("hidden");
    $( "#first" ).removeClass("hidden");

    //hide the second screen
    $("html").removeClass("second-fullscreen-bg");
    $( "#second" ).addClass("hidden");
    $( "#second" ).addClass("fadeout");


    $("html").removeClass("third-fullscreen-bg");
    $( "#third" ).addClass("hidden");
    $( "#third" ).addClass("fadeout");

    setTimeout(function(){
        $( "#first" ).removeClass("fadeout");
    }, 1000);

    // we should be on the second screen now
    //displayDashboard();
}


/**
 * Switch to dashboard.
 */
var switchToDashboard = function() {
    console.log("switchToDashboard")
    $("#welcome-message .top-menubar").removeClass("invisible");

    //hide the first screen
    $( "#first" ).addClass("hidden");
    $( "#first" ).addClass("fadeout");

    //hide the third screen
    $("html").removeClass("full-third");
    $( "#third" ).addClass("hidden");
    $( "#third" ).addClass("fadeout");

    //add the background to the second screen
    $( "#second" ).removeClass("hidden");

    setTimeout(function(){
        $( "#second" ).removeClass("fadeout");

    }, 1000);

    initializemarquee();


}


/**
 * Switch to the Media First X Screen
 */
var switchToMediaFirstX = function() {
    console.log("switchToMediaFirst")

    //hide the first screen
    $( "#first" ).addClass("hidden");
    $( "#first" ).addClass("fadeout");

    //hide the second screen
    $( "#second" ).addClass("hidden");
    $( "#second" ).addClass("fadeout");
    $("#welcome-message .top-menubar").addClass("invisible");

    //add the background to the third screen
    $( "#third" ).removeClass("hidden");


    setTimeout(function(){
        $( "#third" ).removeClass("fadeout");
    }, 1000);

}


/**
 * Get the feeds from Les Affaires Website
 */
/*
var getLesAffairesFeeds = function() {


    var feed = "http://www.lesaffaires.com/rss/blogues/alain-mckenna?format=xml";

    var yql = "https://query.yahooapis.com/v1/public/yql?" +
        "q=select%20*%20from%20rss%20where%20url%3D%22http%3A%2F%2Fwww.lesaffaires.com%2Frss%2Fblogues%2Falain-mckenna%3Fformat%3Dxml%22" +
        "&format=json" +
        "&diagnostics=true" +
        "&callback=";
    return $.getJSON(yql, function(res) {
        console.log("Les Affaires", res);

        var results = res['query']['results'];
        var articles = results['item'];
        if (articles.length > 1) {
            $(".les-affaire-title").html(articles[0].title);
        }

    }, "jsonp");
}
*/

/**
 * Get the feed from TVA Sports
 * @returns {*}
 */
var getTVASportsFeeds = function() {

    console.log("TVA");
    var feed = "http://www.lesaffaires.com/rss/blogues/alain-mckenna?format=xml";

    var yql = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20rss%20where%20" +
        "url%3D%22http%3A%2F%2Fwww.tvasports.ca%2Fhockey%2Flnh%2Frss.xml%22" +
        "&format=json" +
        "&diagnostics=true" +
        "&callback=";
    return $.getJSON(yql, function(res) {
        console.log("TVA", res);

        var results = res['query']['results'];

        var articles = results['item'];
        if (articles.length > 1) {
            var url = articles[0]['content']['url'];
            //replace the size of the returned image url
            var resized_image1 = url.replace(/240/g, "720");
            var resized_image2 = resized_image1.replace(/135/g, "405");

            $(".tvasports-background img").attr('src', resized_image2);

            $(".tvasports-title").html(articles[0].title);
        }



    }, "jsonp");
};



//=========================================
// ALL THE CONNECTED HOME STUFF ARE HERE
//=========================================

/**
 * Trigger an IFTTT event going through the vserver proxy
 * @param event
 * * @param status
 */
var triggerIFTTT = function (event, status) {

    var VSERVER_URL = "http://52.207.31.245:5000/vsmarthome/v1/coffee_maker/" + status;
    $.ajax({
        dataType: "json",
        url: VSERVER_URL,
        success: function (data) {
            console.log("VSERVER Success", data);
        }
    });
}



/**
 * Set Nest thermostat to save energy
 */
var saveEnergy = function () {
    console.log("Saving energy");
}

/**
 * Tick every minute and update time and weather
 */
var tick = function () {
    //display time
    $("#currentTime").html(getTime());
    $("#welcome-time").html(getTime());

    //display weather information
    var icons = new Skycons({"color": "white"});
    getWeather(icons);
}

/**
 * Increment the Tesla charging status
 */
var chargeTesla = function (interval) {
    console.log("Charging Tesla: " + tesla_status);
    if (tesla_status < 100) {
        tesla_status += 1;
        $("tesla-status-placeholder").html(tesla_status);
    }
    else {
        clearInterval(interval);
    }
}


/**
 * Wakupe MODE!
 */
var wakeup = function () {
    $("#first .standby-container .standby_time").addClass("fadeout");
    $("#first .standby-container .standby_time").addClass("standby_time_wakeup");

    setTimeout(function () {
        $("#first .standby-container .standby_time").removeClass("fadeout");


        setTimeout (function () {
            brewCoffee();

            setTimeout (function() {
                openBlinds();

                setTimeout (function() {
                    playSpotify("sounds/spotify/song1.mp3");
                }, 3000);
            },3000);

        }, 2000);

    }, 1000);
}

/**
 * Brewing coffee
 */
var brewCoffee = function() {
    //show slowly that coffee is brewing
    $("#first .standby-container .standby_alarm_events ul.icon-coffee").removeClass("fadeout");
    triggerIFTTT("coffee_maker", "on");

}

/**
 * Pull up blinds (udate CSS)
 */
var pullUpBlinds = function () {
    $(".blinds-status-placeholder").html("UP");
    $("ul.icon-blinds  li:nth-child(2)").addClass("status-on")
}


/**
 * Opening blinds
 */
var openBlinds = function() {
    $("#first .standby-container .standby_alarm_events ul.icon-blinds").removeClass("fadeout");
}

/**
 * Play a wakeup sound
 */
var playWakeupSound = function () {
    console.log("Play Wakeupt Sound");
    $("#wakeup-sound")[0].load();
    $("#wakeup-sound")[0].play();
}
/**
 * Play a goodbye sound
 */
var playGoodbyeSound = function () {
    console.log("Play Goodbye Sound");
    audio = $('audio');
    audio[0].pause();
    $("#goodbye-sound")[0].load();
    $("#goodbye-sound")[0].play();
}
