import querystring from "querystring";

export const request = async (method, path, options = {}) => {
  const { params, body } = options;
  const baseURL = process.env.REACT_APP_BACKEND_URL;
  const fullPath = baseURL + path + "?" + querystring.stringify(params);

  const headers = {
    "Content-Type": "application/json",
  };
  let json, response;
  try {
    response = await fetch(fullPath, {
      method: method,
      body: JSON.stringify(body),
      headers,
    });
  } catch {
    return { response: null, json: null };
  }

  try {
    json = await response.json();
  } catch {
    return { response, json: null };
  }

  return { response, json };
};
