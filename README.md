# Satellite

> A 3D multiplayer space warfare game centered around moon bases and space stations

## How to play locally.

Just run the default grunt task from the root directory by issuing `grunt`

## Controls

Accelerate: W

Brake: S

Roll left: A

Roll right: D

Pitch: Up/Down Arrow

Yaw: Left/Right Arrow

Fire weapon: Spacebar /Left mouse button

## Technology

WebGL - Used to render the game environment

WebSockets - For real time client/server communication

WebWorkers - To ensure physics engine calculations do not block visuals

Node.js - As a server

HTML5 audio - To play sounds/music

## Software used

[Socket.IO] - Socket communication for the client and server

[three.js] - Lightweight JavaScript 3D library

[Physijs] - A physics plugin for [three.js] that utilizes the [ammo.js]/[Bullet physics engine]

[Socket.IO]: http://socket.io/
[three.js]: https://github.com/mrdoob/three.js/
[Physijs]: https://github.com/chandlerprall/Physijs
[ammo.js]: https://github.com/kripken/ammo.js/
[Bullet physics engine]: http://bulletphysics.org

# Credits

Satellite was made at [HackReactor] by a team of very talented people:
[Larry Davis] - Mentor, and code ninja, developed the code base. See [Dune Buggy]
[Phillip Alexander] - Project leader, grunt master, and server code
[Felix Tripier] - Game development wizard, server stuff, music and sound fx, HUD
[Andrew Spade] - Maths wizard, radar, tracking systems, chase camera

[Dune Buggy]: https://github.com/lazd/DuneBuggy
[Larry Davis]: https://github.com/lazd?source=cc
[Felix Tripier]: https://github.com/ftripier
[Phillip Alexander]: https://github.com/phillipalexander?source=cc
[Andrew Spade]: https://github.com/DodekaHydra

# My Contribution

- Bullet Fx and physics
- Shield Fx
- Explosion Fx
