import querystring from "querystring";

export const request = async (
  method,
  path,
  options = {},
  stringify = true,
  useHeaders = true
) => {
  const { params, body, custom_headers = {} } = options;
  const baseURL = process.env.REACT_APP_BACKEND_URL;
  const fullPath = baseURL + path + "?" + querystring.stringify(params);
  let headers = {};
  if (useHeaders)
    headers = {
      "Content-Type": "application/json",
    };

  let json, response;
  try {
    response = await fetch(fullPath, {
      method: method,
      body: stringify ? JSON.stringify(body) : body,
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
