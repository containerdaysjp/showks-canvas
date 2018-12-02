# showKs Canvas
showKs Canvas is a simple collaborative whiteboard using socket.io. This is the participant's web application of Japan Container Days showKs.


## How to modify
1. Create your own branch.

2. Edit src/data/author.json

3. Send a pull request to be merged into staging branch


## How to use

### Run as a container

```
$ docker build -t <your username>/showks-canvas:<your tag> .
$ docker run -p <desired port>:8080 -d <your username>/showks-canvas:<your tag>
```

### Run with Node.js runtime

```
$ cd src
$ npm install
$ npm start
```
Open http://\<your host\>:8080 with a web browser.


### HTTP Endpoints
| Endpoint | Description |
|----------|-------------|
| /          | The whiteboard Web UI        |
| /canvas    | Latest canvas image (PNG)    |
| /thumbnail | Canvas thumbnail (PNG)       |
| /author    | Author information in (JSON) |
| /version   | Version information of Canvas |

#### Author information format

```
{
    "userName": "Unique user name which identifies an instance",
    "gitHubId": "GitHub account of the author",
    "twitterId": "Twitter account of the author",
    "comment": "Comment shown in the listing"
}
```


### Socket.IO Namespaces
| Namespace | Description |
|----------|-------------|
| /notification | Notifies the client of 'refresh' message with value 1 when the drawing is updated and there was no message sent within last 5 seconds.  |


## License

[MIT](LICENSE)

This application is forked from [Socket.IO Collaborative Whiteboard example](https://github.com/socketio/socket.io/tree/master/examples/whiteboard).
