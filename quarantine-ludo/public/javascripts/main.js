// Streaming of audio and video
const mediaStreamConstraints = {
  video: true,
  audio: true,
};

// Video resolution
const hdConstraints = {
  video: {
    width: {
      min: 1280,
    },
    height: {
      min: 720,
    },
  },
};

// Video element where stream will be placed.
const localVideo = document.querySelectorAll("video");

// Local stream that will be reproduced on the video.
let localStream;

// Handles success by adding the MediaStream to the video element.
function gotLocalMediaStream(mediaStream) {
  localStream = mediaStream;
  localVideo[0].srcObject = mediaStream;
  localVideo[1].srcObject = mediaStream;
  localVideo[2].srcObject = mediaStream;
  localVideo[3].srcObject = mediaStream;
}

// Handles error by logging a message to the console with the error message.
function handleLocalMediaStreamError(error) {
  console.log("navigator.getUserMedia error: ", error);
}

// Initializes media stream.
navigator.mediaDevices
  .getUserMedia(mediaStreamConstraints)
  .then(gotLocalMediaStream)
  .catch(handleLocalMediaStreamError);
