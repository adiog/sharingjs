import json
import threading

def web_socket_do_extra_handshake(request):
    pass


class WebSocketSessionRoomController(object):
    session = {}
    session_mutex = threading.Semaphore()

    @classmethod
    def new_connection(cls, request):
        line = request.ws_stream.receive_message()
        data = json.loads(line)
        if data['type'] != 'register':
            raise "Protocol error."
        sid = data['sessionid']
        print 'New connection for ' + sid

        with cls.session_mutex:
            if not cls.session.has_key(sid):
                cls.session[sid] = WebSocketSessionRoomController(sid, request)
            else:
                cls.session[sid].flush(request)
        return cls.session[sid]

    @classmethod
    def del_connection(cls, sid):
        del cls.session[sid]

    def drop(self, request):
        self.sockets.remove(request)
        return (self.sid, not self.sockets)

    def __init__(self, sid, request):
        self.sockets = [request]
        self.message = []
        self.mutex = threading.Semaphore()
        self.sid = sid

    def store_and_enum(self, line):
        data = json.loads(line)
        with self.mutex:
            mid = len(self.message)
            data['mid'] = mid
            line_enumerated = json.dumps(data)
            self.message.append(line_enumerated)
        return line_enumerated

    def broadcast(self, line_enumerated):
        for socket in self.sockets:
            socket.ws_stream.send_message(line_enumerated, binary=False)
            print "sending message" + line_enumerated

    def flush(self, request):
        with self.mutex:
            for msg in self.message:
                request.ws_stream.send_message(msg, binary=False)
                print "sending message" + msg

    def get(self, request):
        line = request.ws_stream.receive_message()
        line_enumerated = self.store_and_enum(line)
        self.broadcast(line_enumerated)


def web_socket_transfer_data(request):
    try:
        session = WebSocketSessionRoomController.new_connection(request)
    except:
        print 'This should have never happened!'
        return

    while True:
        try:
            session.get(request)
        except:
            with WebSocketSessionRoomController.session_mutex:
                sid, drop = session.drop(request)
                if drop:
                    WebSocketSessionRoomController.del_connection(sid)
                    print "Message queue has been deleted."
            print 'This should have never happened!'
            return

# vi:sts=4 sw=4 et

