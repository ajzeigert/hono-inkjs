# InkJS Hono

This repo attempts to create a pure server-side implementation of InkJS. Hono handles all of the javascript, serving plain HTML to the client. State is saved via cookies and all interaction is handled via query parameters.

:construction: Experimental, work in progress

Largely reimplements [https://github.com/smwhr/inkjs-express](https://github.com/smwhr/inkjs-express), but with the goal of state being managed via the player's browser storage.

Big limitations so far: 

- Story object must be re-created on every request to `/continue`, then state restored from cookie. 
- Some states seem to be broken! Lots of `choice out of range null` errors. Contributions on this welcome.

```
bun install
bun run dev
```

```
open http://localhost:3000
```
