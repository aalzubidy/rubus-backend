#!/usr/bin/env node

const fs = require('fs');

const precommit = fs.readFileSync('./pre-commit.sh', 'utf8');

fs.stat('.git', (err) => {
  if (err == null) {
    fs.stat('.git/hooks/pre-commit', (statErr) => {
      if (statErr == null || statErr.code === 'ENOENT') {
        fs.writeFile('.git/hooks/pre-commit', precommit, {
          mode: 0o755,
        }, (writeErr) => {
          if (writeErr) {
            return console.log(writeErr.message);
          }
          return null;
        });
      } else {
        console.log(statErr.message);
      }
    });
  }
});
