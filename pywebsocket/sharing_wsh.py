import json

def web_socket_do_extra_handshake(request):
    pass

sockets = {}
message = {}
def web_socket_transfer_data(request):
    global sockets
    global message
    line = request.ws_stream.receive_message()
    data = json.loads(line)
    if data['type'] == 'register':
        sid = data['sessionid']
        print 'New connection for ' + sid
        if sid not in sockets:
            sockets[sid] = []
        sockets[sid].append(request)
        if sid not in message:
            message[sid] = []
        else:
            for m in message[sid]:
                request.ws_stream.send_message(m, binary=False)
    else:
        print 'This should have never happened!'
        return
    while True:
        try: 
            line = request.ws_stream.receive_message()
            for socket in sockets[sid]:
                if socket != request:
                    socket.ws_stream.send_message(line, binary=False)
        except:
            sockets[sid].remove(request)
            if sockets[sid] == []:
                sockets.pop(sid)
                message.pop(sid)
            return

# vi:sts=4 sw=4 et

