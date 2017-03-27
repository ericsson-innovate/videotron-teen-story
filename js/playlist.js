var audio;
var playlist;
var tracks;
var current;

init();
function init(){
    current = 0;
    audio = $('#audio');

    playlist = [
        "sounds/spotify/song1.mp3",
        /*
        "sounds/spotify/song2.mp3",
        "sounds/spotify/song3.mp3",
        "sounds/spotify/song4.mp3",
        "sounds/spotify/song5.mp3",
        "sounds/spotify/song6.mp3",
        "sounds/spotify/song7.mp3",
        "sounds/spotify/song8.mp3",
        "sounds/spotify/song9.mp3",
        "sounds/spotify/song10.mp3"
        */
    ];


    len = playlist.length - 1;
    audio[0].volume = .10;


    audio[0].addEventListener('ended',function(e){
        current++;
        if(current == len){
            current = 0;
            link = playlist[0];
        }else{
            link = playlist[current];
        }
        playSpotify(link);
    });
}
function playSpotify(link){
    console.log("Play Spotify");
    $("#first .standby-container .standby_alarm_events ul.icon-spotify").removeClass("fadeout");
    audio = $('#audio');
    audio[0].src = link;
    audio[0].load();
    audio[0].play();
}

function stopSpotify() {
    console.log("Pause Spotify");
    audio = $('#audio');
    audio[0].pause();
}