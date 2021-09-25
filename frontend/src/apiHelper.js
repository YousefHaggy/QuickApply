import querystring from "querystring";

export const request = async (method, path, options = {}) => {
  const { params, body } = options;
  const baseURL = process.env.REACT_APP_BACKEND_URL;
  const fullPath = baseURL + path + "?" + querystring.stringify(params);

  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(fullPath, {
    method: method,
    body: JSON.stringify(body),
    headers,
  });

  const json = await response.json();

  return { response, json };
};
