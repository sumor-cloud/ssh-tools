# ssh-tools
SSH connections and tools that are simple, easy to use, and scalable.

[![CI](https://github.com/sumor-cloud/ssh-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/sumor-cloud/ssh-tools/actions/workflows/ci.yml)
[![Test](https://github.com/sumor-cloud/ssh-tools/actions/workflows/ut.yml/badge.svg)](https://github.com/sumor-cloud/ssh-tools/actions/workflows/ut.yml)
[![Coverage](https://github.com/sumor-cloud/ssh-tools/actions/workflows/coverage.yml/badge.svg)](https://github.com/sumor-cloud/ssh-tools/actions/workflows/coverage.yml)
[![Audit](https://github.com/sumor-cloud/ssh-tools/actions/workflows/audit.yml/badge.svg)](https://github.com/sumor-cloud/ssh-tools/actions/workflows/audit.yml)

## Installation
```bash
npm install ssh-tools --save
```

## Prerequisites

### Node.JS version
Require Node.JS version 18.x or above

## Usage

### SSH Connection
```javascript
const SSH = require('@sumor/ssh-tools');
const ssh = SSH({
    // fake server details, replace with your own
    "host": "62.16.12.88",
    "iHost": "172.11.200.330",
    "port": 22,
    "username": "root",
    "password": "password"
});

await ssh.connect();
await ssh.disconnect();
```

### SSH Command
```javascript
const SSH = require('@sumor/ssh-tools');
const ssh = SSH(server);

await ssh.connect();
try {
    const result = await ssh.exec('ls -la');
    console.log(result);
    await ssh.disconnect();
} catch (error) {
    await ssh.disconnect(); // don't forget to disconnect if error occurs
    throw(error);
}
```

### More examples
Please check the [Unit Test](https://github.com/sumor-cloud/ssh-tools/tree/main/test)
