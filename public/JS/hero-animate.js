const videos = [
  "/VIDEO/vedio1.mp4",
  "/VIDEO/vedio2.mp4",
  "/VIDEO/vedio3.mp4",
  "/VIDEO/vedio4.mp4",
  "/VIDEO/vedio5.mp4"
];

let index = 0;
const video = document.getElementById("heroVideo");

function playVideo() {
  video.src = videos[index];
  video.load();
  video.play().catch(err => console.log(err));
}

video.addEventListener("ended", () => {
  index = (index + 1) % videos.length;
  playVideo();
});

playVideo();
