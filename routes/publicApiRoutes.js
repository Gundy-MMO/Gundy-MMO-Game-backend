const express = require("express");
const auth= require("../middleware/auth")

const { createUser, getAllUsers, getUserById, updateUser, getUserByaddress, getSingleUser, acceptFriendRequest, sendFriendRequest, rejectFriendRequest, unfriend, friends,pendingFriendRequest } = require("../controllers/userController");
const { getBanner, addBanner } = require("../controllers/adController");
const { sendMessage, getMessage, getRoomMessage, sendRoomMessage, getUserChats } = require("../controllers/chatController");
 

const publicApiRoutes = express.Router();
 

// /user
publicApiRoutes.post("/create/user", createUser);
publicApiRoutes.get("/all/user", getAllUsers);
publicApiRoutes.get("/get/user/:address",getUserByaddress );
publicApiRoutes.get("/get/user",auth, getUserById);
publicApiRoutes.get("/get/single/user/:id", getSingleUser);
publicApiRoutes.put("/update/user",auth, updateUser);



// friend
publicApiRoutes.post("/send-request", auth, sendFriendRequest);
publicApiRoutes.post("/accept-request", auth, acceptFriendRequest);
publicApiRoutes.post("/reject-request",auth, rejectFriendRequest );
publicApiRoutes.post("/unfriend",auth, unfriend);
publicApiRoutes.get("/friends",auth, friends); 
publicApiRoutes.get("/pending-friends",auth, pendingFriendRequest); 
 

// ad
publicApiRoutes.post("/add-ad-banner", addBanner);
publicApiRoutes.get("/get-ad-banner", getBanner); 


//chat 
publicApiRoutes.post("/send/message", auth,  sendMessage);
publicApiRoutes.get("/get/messages/:chatId", auth,  getMessage);
publicApiRoutes.get("/get/chats", auth,  getUserChats);

publicApiRoutes.post("/send/room/message", auth,  sendRoomMessage);
publicApiRoutes.get("/get/room/messages/:room", auth,  getRoomMessage);

 

module.exports = publicApiRoutes;
