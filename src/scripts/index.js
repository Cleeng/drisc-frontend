import { sign } from "jsonwebtoken";

const createToken = () => {
  const jwtSecretInput = document.getElementById("jwtSecret");
  const customerIdInput = document.getElementById("customerID");
  const publisherIdInput = document.getElementById("publisherID");

  const customerId = customerIdInput.value;
  const publisherId = publisherIdInput.value;
  const secret = jwtSecretInput.value;

  if (!(customerId && publisherId && secret)) {
    return;
  }

  const payload = { customerId, publisherId };

  const token = sign(payload, secret, {
    expiresIn: "2d",
  });
  const SESSION_STORAGE_TOKEN_KEY = 'cleeng_token'


  sessionStorage.setItem(SESSION_STORAGE_TOKEN_KEY, token);

  return token
};

module.exports = {
  createToken,
};
