console.log(NAMESPACE);
var sc = io.connect("/" + NAMESPACE);

sc.on("message", function (data) {
  console.log(`${data}`);
});

var clientIs = {
  makingOffer: false,
  ignoringOffer: false,
  polite:false
}

var rtc_config = null;

//Setting basic to get peer connection
var pc = new RTCPeerConnection(rtc_config);


//video Streams
var media_constraints = {video: true, audio: false};

var selfVideo = document.querySelector('#self-video');
var selfStream = new MediaStream();
selfVideo.srcObject = selfStream;

var peerVideo = document.querySelector('#peer-video');
var peerStream = new MediaStream();
peerVideo.srcObject = peerStream;


async function startStream() {
  try{
    var stream = await navigator.mediaDevices.getUserMedia(media_constraints);
    for( var track of stream.getTracks()){
      pc.addTrack(track);
    }

    selfVideo.srcObject = stream;
  } catch(error){

  }
}


pc.ontrack = (track) => {
  peerStream.addTrack(track.track);
}

var callButton = document.querySelector('#call-button');

callButton.addEventListener('click', startCall);


function startCall(){
  console.log("Calling Side on the room");
  callButton.hidden = true;
  clientIs.polite = true;
  sc.emit('calling');
  startStream();
  negotiateConnection();
}

//handle calling event on the recevier side

sc.on('calling', () => {
  console.log("Receving Side on the room");
  callButton.innerText = "Answer Call";
  callButton.id = "answer-button";
  callButton.removeEventListener('click', startCall);
  callButton.addEventListener('click', ()=>{
    callButton.hidden = true;
    startStream();
    negotiateConnection();
  });
});

