import io from 'socket.io-client'

export default function SocketService () {
  return io()
}
