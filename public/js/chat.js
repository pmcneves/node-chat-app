const socket = io();

// Elements
const $messageForm = document.getElementById("message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.getElementById("send-location");
const $messages = document.getElementById("messages");

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationMessageTemplate = document.getElementById(
  "location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// Auto scroll
const autoscroll = () => {
  // new message element
  const $newMessage = $messages.lastElementChild;

  // height of new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = $messages.offsetHeight;

  // height of messages container
  const containerHeight = $messages.scrollHeight;

  // how far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if(Math.round(containerHeight - newMessageHeight - 1) <= Math.round(scrollOffset)){
    messages.scrollTop = messages.scrollHeight;
}

  console.log(newMessageMargin);
  console.log(newMessageHeight);
};

// connection message
socket.on("welcomeMessage", (welcomeMessage) => {
  console.log(welcomeMessage);
});

// show message in ui
socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

// submit message
$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // disable after submittion
  $messageFormButton.setAttribute("disabled", "disabled");

  socket.emit("sendMessage", e.target.elements.message.value, (error) => {
    //reenable after sent message
    $messageFormButton.removeAttribute("disabled");

    //clear input field after sent message
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log("Message delivered!");
  });
});

// send location
$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not support by your browser");
  }
  navigator.geolocation.getCurrentPosition((position) => {
    $sendLocationButton.setAttribute("disabled", "disabled");
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
        console.log("Location shared");
      }
    );
  });
});

// append location to messages shown in ui
socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

// users in room
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.getElementById("sidebar").innerHTML = html;
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
