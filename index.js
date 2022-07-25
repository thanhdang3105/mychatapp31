const express = require('express');
const cors = require('cors');
const socket = require('socket.io');
const bcrypt = require('bcrypt');
require('dotenv').config();
const connectDB = require('./database/connectDB');
const Users = require('./database/model/Users');
const Rooms = require('./database/model/Rooms');
const Inboxs = require('./database/model/Inboxs');
const Messages = require('./database/model/Messages');
const { sendMail } = require('./sendEmail');
const port = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN,
    }),
);

connectDB();

app.post('/api/users', (req, res) => {
    const { action, data } = req.body;
    switch (action) {
        case 'login':
            Users.findOne({ email: data.email, provider: data.provider })
                .then((user) => {
                    if (user && data.password) {
                        bcrypt.compare(data.password, user.password).then((result) => {
                            if (result) {
                                const { _id, name, photoURL, email, provider, createdAt } = user;
                                res.status(200).json({ _id, name, photoURL, email, provider, createdAt });
                            } else {
                                res.status(300).json({ message: 'Sai mật khẩu!' });
                            }
                        });
                    } else if (user && !data.password) {
                        const { _id, name, photoURL, email, provider, createdAt } = user;
                        res.status(200).json({ _id, name, photoURL, email, provider, createdAt });
                    } else {
                        res.status(300).json({ message: 'Tài khoản không tồn tại!' });
                    }
                })
                .catch((err) => res.status(300).json({ message: 'Xảy ra lỗi!' }));
            break;
        case 'register':
            Users.findOne({ email: data.email, provider: 'email/pwd' })
                .then((user) => {
                    if (!user) {
                        bcrypt.hash(data.password, 10).then((pwdHash) => {
                            if (pwdHash) {
                                const newUser = new Users({
                                    name: data.name,
                                    email: data.email,
                                    password: pwdHash,
                                    createdAt: data.createdAt,
                                });
                                newUser.save((err) => {
                                    if (err) return console.log(err);
                                    const { _id, name, photoURL, email, provider, createdAt } = newUser;
                                    res.status(200).json({ _id, name, photoURL, email, provider, createdAt });
                                });
                            } else {
                                res.status(300).json({ message: 'Lỗi!' });
                            }
                        });
                    } else {
                        res.status(300).json({ message: 'Tài khoản đã tồn tại!' });
                    }
                })
                .catch((err) => res.status(300).json({ message: 'Xảy ra lỗi!' }));
            break;
        case 'create':
            Users.findOne({ email: data.email, provider: data.provider }).then((result) => {
                if (!result) {
                    const newUser = new Users(data);
                    newUser.save((err) => {
                        if (err) return res.status(500).json();
                        delete newUser.password;
                        const { _id, name, photoURL, email, provider, createdAt } = newUser;
                        res.status(200).json({ _id, name, photoURL, email, provider, createdAt });
                    });
                }
            });
            break;
        case 'reLogin':
            Users.findById(data)
                .then((user) => {
                    if (user) {
                        const { _id, name, email, photoURL, provider, createdAt } = user;
                        res.status(200).json({ _id, name, email, photoURL, provider, createdAt });
                    } else {
                        res.status(300).json();
                    }
                })
                .catch((err) => res.status(500).json());
            break;
        case 'update':
            Users.findByIdAndUpdate(data.id, data.dataUpdate)
                .then(() => {
                    res.status(200).json();
                })
                .catch((err) => res.status(500).json());
            break;
        case 'changePWD':
            Users.findById(data.id).then((user) => {
                bcrypt.compare(data.old, user.password).then((result) => {
                    if (result) {
                        bcrypt
                            .hash(data.new, 10)
                            .then((pwdHash) => {
                                if (pwdHash) {
                                    user.password = pwdHash;
                                    user.save((err) => {
                                        if (err) return res.status(500).json();
                                        res.status(200).json();
                                    });
                                } else {
                                    res.status(300).json({ message: 'Lỗi!' });
                                }
                            })
                            .catch((err) => res.status(500).json());
                    } else {
                        res.status(300).json();
                    }
                });
            });
            break;
        case 'checkEmail':
            Users.findOne({ email: data, provider: 'email/pwd' })
                .then((user) => {
                    if (user) {
                        global.privateKey = req.body.id;
                        global.time = setTimeout(() => {
                            global.privateKey = null;
                        }, 36000000);
                        sendMail(privateKey, user.email).then(() => {
                            res.status(200).json(user._id);
                        });
                    } else {
                        res.status(300).json();
                    }
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).json();
                });
            break;
        case 'resetPWD':
            if (data.code === privateKey) {
                clearTimeout(time);
                bcrypt
                    .hash(data.newPass, 10)
                    .then((pwdHash) => {
                        Users.findByIdAndUpdate(data.emailCode, { password: pwdHash })
                            .then((user) => {
                                res.status(200).json();
                                privateKey = null;
                            })
                            .catch((err) => {
                                console.log(err);
                                res.status(500).json();
                            });
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(500).json();
                        0;
                    });
            } else if (data.code !== privateKey) {
                res.status(300).json();
            } else if (!privateKey) {
                res.status(301).json();
            }
            break;
        default:
            throw new Error('Invalid action: ' + action);
    }
});

app.post('/api/rooms', (req, res) => {
    const { action, data } = req.body;
    switch (action) {
        case 'create':
            const newRooms = new Rooms(data);
            newRooms.save((err) => {
                if (err) return res.status(500).json();
                newRooms.messages = [];
                res.status(200).json(newRooms);
            });
            break;
        case 'update':
            Rooms.findByIdAndUpdate(data.id, {
                $addToSet: { members: { $each: data.newUsers } },
                lastested: Date.now(),
            })
                .then(() => {
                    res.status(200).json();
                })
                .catch((err) => {
                    res.status(500).json();
                    console.log(err);
                });
            break;
        case 'changeBGR':
            const newData = { background: data.newImg, $addToSet: { backgroundList: data.newImg } };
            Rooms.findByIdAndUpdate(data.id, { ...newData, lastested: Date.now() })
                .then(() => {
                    res.status(200).json();
                })
                .catch((err) => {
                    res.status(500).json();
                    console.log(err);
                });
            break;
        case 'setAvatar':
            Rooms.findByIdAndUpdate(data.id, {
                photoURL: data.url,
                lastested: Date.now(),
            })
                .then(() => {
                    res.status(200).json();
                })
                .catch((err) => {
                    res.status(500).json();
                    console.log(err);
                });
            break;
        case 'outRoom':
            Rooms.findById(data.id).then((room) => {
                if (room && room.members.length <= 1) {
                    room.delete();
                    Messages.deleteMany({ foreignId: room._id })
                        .then(() => res.status(200).json())
                        .catch((err) => res.status(500).json(err));
                } else if (room && room.members.length > 1) {
                    const newMembers = room.members.filter((member) => member !== data.userId);
                    Rooms.updateOne({ _id: data.id }, { members: newMembers, lastested: Date.now() })
                        .then(() => {
                            res.status(200).json();
                        })
                        .catch((err) => {
                            res.status(500).json();
                            console.log(err);
                        });
                } else {
                    res.status(300).json({ message: 'Phòng không tồn tại' });
                }
            });
            break;

        default:
            break;
    }
});

app.post('/api/inboxs', (req, res) => {
    const { action, data } = req.body;
    switch (action) {
        case 'create':
            const newInboxs = new Inboxs(data);
            const newMsg = new Messages({ ...data.newMsg, foreignId: newInboxs._id });
            newInboxs
                .save()
                .then(() => {
                    newMsg.save((err) => {
                        if (err) res.status(500).json();
                        res.status(200).json(newInboxs);
                    });
                })
                .catch((err) => res.status(500).json());
            break;
        case 'changeBGR':
            const newData = { background: data.newImg, $addToSet: { backgroundList: data.newImg } };
            Inboxs.findByIdAndUpdate(data.id, { ...newData, lastested: Date.now() })
                .then(() => {
                    res.status(200).json();
                })
                .catch((err) => {
                    res.status(500).json();
                    console.log(err);
                });
            break;
        default:
            throw new Error('Invalid action: ' + action);
    }
});

app.get('/api/database', (req, res) => {
    const userId = req.query.id;

    Promise.all([
        Rooms.aggregate()
            .match({ members: userId })
            .lookup({
                from: 'messages',
                localField: '_id',
                foreignField: 'foreignId',
                as: 'messages',
                pipeline: [
                    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
                    { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$user', 0] }, '$$ROOT'] } } },
                    {
                        $project: {
                            _id: 0,
                            user: 0,
                            updatedAt: 0,
                            provider: 0,
                            password: 0,
                            foreignId: 0,
                        },
                    },
                ],
            })
            .unwind('$members')
            .addFields({ members: { $toObjectId: '$members' } })
            .lookup({
                localField: 'members',
                from: 'users',
                foreignField: '_id',
                as: 'members',
                pipeline: [{ $project: { password: 0, updatedAt: 0 } }],
            })
            .group({
                _id: '$_id',
                members: { $push: { $arrayElemAt: ['$members', 0] } },
                messages: { $first: '$messages' },
                description: { $first: '$description' },
                name: { $first: '$name' },
                photoURL: { $first: '$photoURL' },
                backgroundList: { $first: '$backgroundList' },
                background: { $first: '$background' },
                lastested: { $first: '$lastested' },
            }),
        Inboxs.aggregate([
            { $match: { users: userId } },
            {
                $unwind: '$users',
            },
            { $match: { users: { $ne: userId } } },
            {
                $addFields: {
                    checkUser: { $toObjectId: '$users' },
                },
            },
            {
                $lookup: {
                    localField: 'checkUser',
                    from: 'users',
                    foreignField: '_id',
                    as: 'users',
                },
            },
            {
                $addFields: {
                    userId: { $arrayElemAt: ['$users._id', 0] },
                },
            },
            { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$users', 0] }, '$$ROOT'] } } },
            { $project: { password: 0, provider: 0, updatedAt: 0, users: 0, checkUser: 0 } },
            {
                $lookup: {
                    from: 'messages',
                    localField: '_id',
                    foreignField: 'foreignId',
                    as: 'messages',
                    pipeline: [
                        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
                        { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$user', 0] }, '$$ROOT'] } } },
                        {
                            $project: {
                                _id: 0,
                                user: 0,
                                updatedAt: 0,
                                provider: 0,
                                password: 0,
                                foreignId: 0,
                            },
                        },
                    ],
                },
            },
        ]).sort({ lastested: 'desc' }),
        Users.aggregate([
            { $addFields: { online: false } },
            { $set: { _id: { $toString: '$_id' } } },
            { $match: { _id: { $ne: userId } } },
            { $set: { _id: { $toObjectId: '$_id' } } },
            { $project: { password: 0, updatedAt: 0 } },
        ]),
    ])
        .then(([rooms, inboxs, users]) => {
            res.status(200).json({
                rooms,
                inboxs: inboxs,
                users: users,
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json();
        });
});

app.post('/api/messages', (req, res) => {
    const { action, data } = req.body;
    switch (action) {
        case 'create':
            const newMsg = new Messages(data);
            newMsg.save((err) => {
                if (err) return res.status(500).json();
                res.status(200).json(newMsg);
            });
            Promise.all([
                Rooms.findByIdAndUpdate(data.foreignId, { lastested: Date.now() }),
                Inboxs.findByIdAndUpdate(data.foreignId, { lastested: Date.now() }),
            ]).catch((err) => {
                console.log(err);
            });
            break;
        default:
            throw new Error('Invalid action: ' + action);
    }
});

const server = app.listen(port);

const io = socket(server, {
    cors: {
        origin: process.env.CLIENT_ORIGIN,
        credentials: true,
    },
});

global.onlineUsers = new Map();
global.online = [];

io.on('connection', (socket) => {
    socket.on('user_connect', (userId) => {
        socket.data.userId = userId;
        onlineUsers.set(userId, socket.id);
        if (!online.includes(userId)) {
            online.push(userId);
        }
        io.local.emit('user_online', online);
    });

    socket.on('userChangeInfo', (data) => {
        socket.broadcast.emit('userChangeInfo', data);
    });

    socket.on('roomChange_info', ({ id, data }) => {
        socket.to(id).emit('roomChange_info', { id, data });
    });

    socket.on('join_room', (data) => {
        socket.join(data);
    });

    socket.on('out_room', (data) => {
        socket.leave(data.room);
        socket.to(data.room).emit('user_outRoom', data);
    });

    socket.on('addUser_room', (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit('recive_newRoom', data.room);
        }
    });

    socket.on('send_message-toUsers', (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit('recive_userMsg', data.newInbox);
        }
    });

    socket.on('send_message-toRoom', (data) => {
        // const sendUserSocket = onlineUsers.get(data.to);
        socket.to(data.to).emit('recive_msg', data.msg);
    });

    socket.on('calling_user', ({ to, from, name }) => {
        const sendUserSocket = onlineUsers.get(to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit('send_call', { from, name });
        }
    });

    socket.on('answer_call', ({ id, mess }) => {
        const sendUserSocket = onlineUsers.get(id);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit('revice_answerCall', mess);
        }
    });

    socket.on('send_offer', ({ to, offer }) => {
        const sendUserSocket = onlineUsers.get(to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit('revice_offer', offer);
        }
    });

    socket.on('send_answer', ({ to, answer }) => {
        const sendUserSocket = onlineUsers.get(to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit('revice_answer', answer);
        }
    });

    socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
            // the disconnection was initiated by the server, you need to reconnect manually
            socket.connect();
        } else if (reason === 'transport close' || reason === 'client namespace disconnect') {
            if (socket.data.userId) {
                onlineUsers.delete(socket.data.userId);
                online = online.filter((user) => user !== socket.data.userId);
                io.local.emit(
                    'user_online',
                    online.filter((user) => user !== socket.data.userId),
                );
            }
        }

        // else the socket will automatically try to reconnect
    });
});
