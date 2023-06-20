#!/bin/bash
#npm run build 2>/dev/null
node-deb --install-strategy npm-install -- app.js api/ dist/
