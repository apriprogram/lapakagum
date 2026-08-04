const fs = require('node:fs');

function normalize(error) {
  if (error && error.code === 'EISDIR' && error.syscall === 'readlink') {
    error.code = 'EINVAL';
  }
  return error;
}

const readlink = fs.readlink.bind(fs);
fs.readlink = (...args) => {
  const callback = args.at(-1);
  if (typeof callback === 'function') {
    args[args.length - 1] = (error, value) => callback(normalize(error), value);
  }
  return readlink(...args);
};

const readlinkSync = fs.readlinkSync.bind(fs);
fs.readlinkSync = (...args) => {
  try {
    return readlinkSync(...args);
  } catch (error) {
    throw normalize(error);
  }
};

const promiseReadlink = fs.promises.readlink.bind(fs.promises);
fs.promises.readlink = async (...args) => {
  try {
    return await promiseReadlink(...args);
  } catch (error) {
    throw normalize(error);
  }
};
