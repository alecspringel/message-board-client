'''
This file deals with the websockets using SocketIO.
It's how our client can be updated in realtime for the user.

Authors: Sam Peters and Alec Springel
Group Name: 5 Bits in a Byte

Last Modified Date: 03/12/2021
'''
from inquire.auth import current_user, permission_layer
from inquire.mongo import *

from flask_socketio import *
from flask import Blueprint, render_template

io = SocketIO(logger=True, engineio_logger=False, cors_allowed_origins="*")

# Blueprint stores authentication related routes
socketio_blueprint = Blueprint(
    'socketio_blueprint', __name__, template_folder='templates')


@io.on('connect')
def connect():
    if current_user == None:
        raise ConnectionRefusedError('unauthorized testing!')
    else:
        print(current_user.first, "connected")
    return "connected"


@io.on('disconnect')
def disconnect():
    if current_user == None:
        print("Unauthorized user disconnected")
    else:
        print(f"{current_user.first} {current_user.last} disconnected")
    return "disconnected"


@io.on('join')
def on_join(data):
    room = data['room']
    print("SOCKETIO TEST: ", room)
    room_type = data['room_type']
    status = False
    if room_type == "course":
        course = current_user.get_course(room)
        if course:
            status = True
    elif room_type == "post":
        post = Post.objects.raw({'_id': room}).first()
        if post is not None:
            course = current_user.get_course(post.courseId)
            if course:
                status = True
    if status:
        join_room(room)


@io.on('leave')
def on_leave(data):
    room = data['room']
    leave_room(room)


@io.on('blah')
def blah(data):
    print(data)
    return "blah"


@socketio_blueprint.route('/emit-msg')
def emit_msg():
    io.emit('test', {'msg': "abc", 'nums': [1, 2, 3]})
    return 'success'


@socketio_blueprint.route('/')
def index():
    return render_template("socketio.html")
