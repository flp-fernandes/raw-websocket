import { createServer } from 'http';
import crypto from 'crypto';

const PORT = 1337
const WEBSOCKET_MAGIC_STRING_KEY = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const SEVEN_BITS_INTEGER_MARKER = 125;
const SIXTEEN_BITS_INTEGER_MARKER = 126;
const SIXTYFOUR_BITS_INTEGER_MARKER = 127;

// parseInt('10000000', 2)
const FIRST_BIT = 128;

const server = createServer((req, res) => {
  res.writeHead(200);
  res.end('hey there!');
}).listen(PORT, () => console.log(`*** app is running on port ${PORT} ***`));

server.on('upgrade', onSocketUpgrade)

function onSocketUpgrade(req, socket, head) {
  const {
    'sec-websocket-key': webClientSocketKey
  } = req.headers;

  const headers = prepareHandShakeHeaders(webClientSocketKey);

  socket.write(headers);
  socket.on('readable', () => onSocketReadable(socket));
}

function onSocketReadable(socket) {
  // consume optcode (first byte)
  // 1 byte = 8 bits
  socket.read(1);
  const [markerAndPayloadLenght] = socket.read(1);
  // because the first bit is always 1 for client-to-server messages
  // you can subtract one bit (128 or '10000000')
  // from this byte to et rid of the mask bit
  const lengthIndicatorInBits = markerAndPayloadLenght - FIRST_BIT;

  let messageLength = 0;
}

function prepareHandShakeHeaders(id) {
  const acceptKey = createSocketAccept(id);

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    ''
  ].map((line) => line.concat('\r\n')).join('');

  return headers;
}

function createSocketAccept(id) {
  const shaOne = crypto.createHash('sha1');
  shaOne.update(id + WEBSOCKET_MAGIC_STRING_KEY);

  return shaOne.digest('base64');
}

// error handling to keep the server on
;
[
  'uncaughtException',
  'unhandledRejection'
].forEach((event) => {
  process.on(event, (err) => {
    console.error(`something bad happened! event: ${event}, msg: ${err.stack || err}`);
  })
});
