const fs = require('fs')
const { exec } = require('child_process')

function start () {
  return new Promise(function (resolve, reject) {
    const privateKey = 'jwtRS256.key'
    const publicKey = 'jwtRS256.key.pub'
    if (!fs.existsSync(privateKey)) {
      console.log('[START] Generating Private Key')
      exec(`ssh-keygen -t rsa -b 4096 -m PEM -f ${privateKey} -N ""`, (error, stdout, stderr) => {
        if (error !== null) {
          console.log(stderr)
          reject(error)
        }
        console.log('[START] Generating Public Key')
        exec(`openssl rsa -in ${privateKey} -pubout -outform PEM -out ${publicKey}`, (error, stdout, stderr) => {
          if (error !== null) {
            console.log(stderr)
            reject(error)
          }
          resolve()
        })
      })
    } else {
      console.log('[START] Found keys')
      resolve()
    }
  })
}

module.exports = { start }
