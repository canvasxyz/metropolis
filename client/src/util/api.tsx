// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import URLs from "./url"

const urlPrefix = URLs.urlPrefix
const basePath = ""

// var pid = "unknownpid";

function ajax(api, data, type, params) {
  if (typeof api !== "string") {
    throw new Error("api param should be a string")
  }

  if (api && api.length && api[0] === "/") {
    api = api.slice(1)
  }

  const url = urlPrefix + basePath + api

  // Add the auth token if needed.
  // if (_.contains(authenticatedCalls, api)) {
  //     var token = tokenStore.get();
  //     if (!token) {
  //         needAuthCallbacks.fire();
  //         console.error("auth needed");
  //         return $.Deferred().reject("auth needed");
  //     }
  //     //data = $.extend({ token: token}, data); // moving to cookies
  // }

  let promise
  const config = {
    url: url,
    contentType: "application/json; charset=utf-8",
    headers: {
      "Cache-Control": params?.noCache ? "no-cache" : "max-age=0",
    },
    xhrFields: {
      withCredentials: true,
    },
    // crossDomain: true,
    dataType: "json",
  }
  if (type === "GET") {
    promise = $.ajax(
      $.extend(config, {
        type: "GET",
        data: data,
      })
    )
  } else if (type === "POST") {
    promise = $.ajax(
      $.extend(config, {
        type: "POST",
        data: JSON.stringify(data),
      })
    )
  }

  promise.fail(function (jqXHR, message, errorType) {
    // sendEvent("Error", api, jqXHR.status);

    // logger.error("SEND ERROR");
    console.log("polisAjax promise failed: ", jqXHR, message, errorType)
    if (jqXHR.status === 403) {
      // eb.trigger(eb.authNeeded);
    }
    // logger.dir(data);
    // logger.dir(message);
    // logger.dir(errorType);
  })
  return promise
}

function post(api, data, params?) {
  return ajax(api, data, "POST", params)
}

function get(api, data, params?) {
  return ajax(api, data, "GET", params)
}

const api = { get, post, ajax }

export default api
