/* return a limited set of data for public calls */
const prepareUserPublicProfile = data => {
  const allowedKeys = ["first_name", "last_name", "id"];
  const userObj = {};
  if (typeof data === "object") {
    allowedKeys.forEach(key => {
      if (data[key]) {
        userObj[key] = data[key];
      }
    });
  }
  return userObj;
};

/* return a limited set of data for public calls */
const prepareUserPrivateProfile = data => {
  const allowedKeys = ["first_name", "last_name", "_id", "email"];
  const userObj = {};
  if (typeof data === "object") {
    allowedKeys.forEach(key => {
      if (data[key]) {
        userObj[key] = data[key];
      }
    });
  }
  return userObj;
};

module.exports = { prepareUserPublicProfile, prepareUserPrivateProfile };
