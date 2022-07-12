import * as params from "@params";
var apiBaseUrl = (params || {}).apibaseurl;

function getLocalStorageItem(key) {
  var item = localStorage.getItem(key);
  try {
    const { expires, value } = JSON.parse(item);
    if (Date.now() > expires) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch (e) {
    return item;
  }
}

// 604,800,000: 7 days
function setLocalStorageItem(key, value, maxAge = 604800000, expiry = 0) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        expires: expiry || Date.now() + maxAge,
        value,
      })
    );
  } catch (e) {}
}

function ajax(method, url, data, success, error, isForm) {
  var xhr = new XMLHttpRequest();
  var realUrl = `${apiBaseUrl}/${url}`;
  var token = getLocalStorageItem("token");
  xhr.open(method, realUrl);
  xhr.setRequestHeader("Accept", "application/json");
  if (isForm) {
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  } else {
    xhr.setRequestHeader("Content-Type", "application/json");
  }
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== XMLHttpRequest.DONE) return;
    var status = xhr.status;
    if (status >= 200 && status < 400) {
      success(JSON.parse(xhr.response), xhr.responseType);
    } else if (status >= 400 && status <= 500) {
      error(JSON.parse(xhr.response), xhr.responseType, xhr.status);
    } else {
      var defaultResponse = {
        detail: "服务出错，请稍后再试",
      };
      error(defaultResponse, xhr.responseType, xhr.status);
    }
  };
  if (isForm) {
    xhr.send(data);
  } else {
    xhr.send(JSON.stringify(data));
  }
}

function formHandler(formId) {
  var form = document.getElementById(formId);
  var button = document.getElementById(`${formId}-button`);
  var status = document.getElementById(`${formId}-status`);

  function success() {
    form.reset();
    button.style = "display: none ";
    status.innerHTML = "Thanks! Contact form is submitted successfully.";
  }

  function error() {
    status.innerHTML = "Oops! There was a problem.";
  }

  // handle the form submission event
  if (form != null) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = new FormData(form);
      ajax(form.method, form.action, data, success, error);
    });
  }
}

window.addEventListener("DOMContentLoaded", function () {
  formHandler("login-form");
});

// ---------------register code start
function checkEmail(email) {
  if (!email) {
    return false;
  }
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return true;
  }
  return false;
}

// 元素是否可用，一般loading时，元素不可用
function disableChange(id, disabled) {
  if (!id) {
    return;
  }
  var ele = $(`#${id}`);
  ele.attr("disabled", disabled);
}

// loading 样式，一般在 button a 中
function loadingChange(loadingId, loading, buttonId) {
  var loadingEle = $(`#${loadingId}`);
  if (loading) {
    loadingEle.show().css("display", "inline-block");
    disableChange(buttonId, true);
  } else {
    loadingEle.hide();
    disableChange(buttonId, false);
  }
}

function fetchEmailCode() {
  var alertDiv = $("#register_alert");
  var successDiv = $("#register_success");
  var loadingId = "code_loading";
  var buttonId = "get_code";
  function success() {
    loadingChange(loadingId, false, buttonId);
    alertDiv.hide();
    successDiv.show().text("验证码已发送，请访问邮箱查收");
  }

  function error(response) {
    loadingChange(loadingId, false, buttonId);
    var detail = response.detail;
    alertDiv.show().text(`发送验证码失败，请重试: ${detail}`);
    successDiv.hide();
  }

  $("#get_code").on("click", function (event) {
    event.preventDefault();
    successDiv.hide();
    alertDiv.hide();
    var email = $("#register_email").val();
    var checkResult = checkEmail(email);
    if (!checkResult) {
      alertDiv.show().text("请输入正确的邮箱地址");
      return;
    }
    alertDiv.hide().text("");
    var method = "post";
    var url = "api/v1/emails/send-captcha";
    var data = { email };
    loadingChange(loadingId, true, buttonId);
    ajax(method, url, data, success, error);
  });
}

function registerFormHandler() {
  var form = document.getElementById("register_form");
  var alertDiv = $("#register_alert");
  var successDiv = $("#register_success");
  var buttonId = "register_form_button";
  var loadingId = "register_loading";

  // initRegisterForm();

  function success() {
    form.reset();
    alertDiv.hide();
    successDiv.show().text("注册成功，请登录");
    loadingChange(loadingId, false, buttonId);
    setTimeout(function () {
      window.location.href = "/login";
    }, 500);
  }

  function error(response) {
    loadingChange(loadingId, false, buttonId);
    var detail = response.detail;
    alertDiv.show().text(`注册失败，请重试：${detail}`);
    successDiv.hide();
  }

  function checkFormData(formData) {
    if (formData.password !== formData.passwordConfirm) {
      alertDiv.show().text("请确保两次输入的密码一致");
      return false;
    }
    return true;
  }

  // handle the form submission event
  if (form != null) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      alertDiv.hide();
      successDiv.hide();
      var data = new FormData(form);
      var registerData = {};
      data.forEach(function (value, key) {
        registerData[key] = value;
      });
      var result = checkFormData(registerData);
      if (!result) {
        return;
      }
      var method = "post";
      var url = "api/v1/users/register";
      loadingChange(loadingId, true, buttonId);
      ajax(method, url, registerData, success, error);
    });
  }
}

$(document).ready(fetchEmailCode);
$(document).ready(registerFormHandler);
// ---------------register code end

// ---------------forget password code start
function fetchPasswordEmailCode() {
  var alertDiv = $("#password_alert");
  var successDiv = $("#password_success");
  var loadingId = "code_loading";
  var buttonId = "get_password_code";
  function success() {
    loadingChange(loadingId, false, buttonId);
    alertDiv.hide();
    successDiv.show().text("验证码已发送，请访问邮箱查收");
  }

  function error(response) {
    loadingChange(loadingId, false, buttonId);
    var detail = response.detail;
    alertDiv.show().text(`发送验证码失败，请重试: ${detail}`);
    successDiv.hide();
  }

  $(`#${buttonId}`).on("click", function (event) {
    event.preventDefault();
    successDiv.hide();
    alertDiv.hide();
    var email = $("#password_email").val();
    var checkResult = checkEmail(email);
    if (!checkResult) {
      alertDiv.show().text("请输入正确的邮箱地址");
      return;
    }
    alertDiv.hide().text("");
    var method = "post";
    var url = "api/v1/emails/send-captcha";
    var data = { email };
    loadingChange(loadingId, true, buttonId);
    ajax(method, url, data, success, error);
  });
}

function passwordFormHandler() {
  var form = document.getElementById("password_form");
  var alertDiv = $("#password_alert");
  var successDiv = $("#password_success");
  var buttonId = "password_form_button";
  var loadingId = "password_loading";

  function success(response) {
    form.reset();
    alertDiv.hide();
    successDiv.show().text("修改密码成功，请登录");
    loadingChange(loadingId, false, buttonId);
    setTimeout(function () {
      window.location.href = "/login";
    }, 500);
  }

  function error(response) {
    loadingChange(loadingId, false, buttonId);
    var detail = response.detail;
    alertDiv.show().text(`修改密码失败，请重试：${detail}`);
    successDiv.hide();
  }

  function checkFormData(formData) {
    if (formData.password !== formData.passwordConfirm) {
      alertDiv.show().text("请确保两次输入的密码一致");
      return false;
    }
    return true;
  }

  // handle the form submission event
  if (form != null) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      alertDiv.hide();
      successDiv.hide();
      var data = new FormData(form);
      var passwordData = {};
      data.forEach(function (value, key) {
        passwordData[key] = value;
      });
      var result = checkFormData(passwordData);
      if (!result) {
        return;
      }
      var method = "post";
      var url = "api/v1/users/reset-password";
      loadingChange(loadingId, true, buttonId);
      ajax(method, url, passwordData, success, error);
    });
  }
}
$(document).ready(fetchPasswordEmailCode);
$(document).ready(passwordFormHandler);
// ---------------forget password code end

// ---------------login code start
function loginFormHandler() {
  var form = document.getElementById("login_form");
  var alertDiv = $("#login_alert");
  var successDiv = $("#login_success");
  var buttonId = "login_form_button";
  var loadingId = "login_loading";

  // initRegisterForm();
  function handleLoginResult(response) {
    var token = response.access_token;
    setLocalStorageItem("token", token);
  }

  function handleRemember(data) {
    var remember = data.remember;
    if (remember) {
      setLocalStorageItem("remember", data);
    } else {
      var newData = JSON.parse(JSON.stringify(data));
      delete newData.password;
      setLocalStorageItem("remember", newData);
    }
  }

  function success(response) {
    form.reset();
    alertDiv.hide();
    successDiv.show().text("登录成功");
    handleLoginResult(response);
    loadingChange(loadingId, false, buttonId);
    setTimeout(function () {
      window.location.href = "/";
    }, 500);
  }

  function error(response) {
    loadingChange(loadingId, false, buttonId);
    var detail = response.detail;
    alertDiv.show().text(`登录失败，请重试：${detail}`);
    successDiv.hide();
  }

  // handle the form submission event
  if (form != null) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      alertDiv.hide();
      successDiv.hide();
      var data = new FormData(form);
      var loginData = {};
      data.forEach(function (value, key) {
        loginData[key] = value;
      });

      handleRemember(loginData);
      var method = "post";
      var url = "api/v1/login";
      const requestData = Object.keys(loginData)
        .map((key) => {
          return (
            encodeURIComponent(key) + "=" + encodeURIComponent(loginData[key])
          );
        })
        .join("&");
      loadingChange(loadingId, true, buttonId);
      ajax(method, url, requestData, success, error, true);
    });
  }
}

function loginFormRememberHandler() {
  var rememberData = getLocalStorageItem("remember") || {};
  var email = rememberData.email || "";
  var password = rememberData.password || "";
  var remember = rememberData.remember || false;
  $("#login_form_email").val(email);
  $("#login_form_password").val(password);
  if (remember) {
    $("#login_form_remember").prop("checked", true);
  }
}

$(document).ready(loginFormHandler);
$(document).ready(loginFormRememberHandler);
// ---------------login code end

// ---------------user info start
function handleUserInfo() {
  function success(response) {
    setLocalStorageItem("userInfo", response);
    $("#nav_no_user").hide();
    $("#nav_user_email").text(response.email);
    handleUserInfoForWindow();
  }
  function error() {
    setLocalStorageItem("token", "");
    setLocalStorageItem("userInfo", {});
    $("#nav_no_user").show();
    $("#nav_user").hide();
    $("#nav_user_small").hide();
  }

  var token = getLocalStorageItem("token");
  if (!token) {
    error();
    return;
  } else {
    var userInfo = getLocalStorageItem("userInfo");
    success(userInfo);
  }
  var method = "get";
  var url = "api/v1/users/me";
  ajax(method, url, {}, success, error);
}

function handleAvatarHover() {
  $("#nav_user").hover(function () {
    $("#dropdownAvatar img").click();
  });
}

$(document).ready(handleUserInfo);
$(document).ready(handleAvatarHover);

// ---------------user info end

// ---------------window width deal with userInfo

function handleUserInfoForWindow() {
  var width = $(window).width();
  var token = getLocalStorageItem("token");
  if (!token) {
    return;
  }
  if (width <= 991) {
    $("#nav_user_small").show();
    $("#nav_user").hide();
  } else {
    $("#nav_user_small").hide();
    $("#nav_user").show();
  }
}
$(window).resize(handleUserInfoForWindow);

// ---------------logout start
function handleLogout() {
  function logout(event) {
    event.preventDefault();
    setLocalStorageItem("token", "");
    setLocalStorageItem("userInfo", {});
    setTimeout(() => {
      location.reload();
    }, 20);
  }
  $("#user_logout").on("click", logout);
  $("#user_logout_small").on("click", logout);
}
$(document).ready(handleLogout);
// ---------------logout end

// -----------handle download
// function handleDownload() {
//   function download() {
//     var url = "api/v1/download/whitepaper";
//     var realUrl = `${apiBaseUrl}/${url}`;
//     let a = document.createElement("a");

//     a.setAttribute("href", realUrl);

//     a.click();
//   }

//   $("#download_btn").on("click", download);
//   $("#download_form_button").on("click", download);
//   $("#download_footer").on("click", download);
// }
// $(document).ready(handleDownload);

/* subscriptions */
function handleSubscription() {
  var form = document.getElementById("subscribe_form");
  var alertDiv = $("#subscribe_alert");
  var successDiv = $("#subscribe_success");
  alertDiv.hide();
  successDiv.hide();

  $("#subscribe_form_button").on("click", function (event) {
    event.preventDefault();

    var email = $("#subscribe_form_email").val();
    var checkResult = checkEmail(email);
    if (!checkResult) {
      alertDiv.show().text("请输入正确的邮箱地址");
      return;
    }
    alertDiv.hide().text("");
    var method = "post";
    var url = "api/v1/subscriptions";
    var loadingId = "subscribe_loading";
    var buttonId = "subscribe_form_button";
    var data = { email };

    function success(response) {
      form.reset();
      alertDiv.hide();
      successDiv.show().text("已发送确认邮件，请查收");

      loadingChange(loadingId, false, buttonId);
    }

    function error(response) {
      loadingChange(loadingId, false, buttonId);
      var detail = response.detail;
      alertDiv.show().text(`邮件发送失败，请重试：${detail}`);
      successDiv.hide();
    }

    loadingChange(loadingId, true, buttonId);
    ajax(method, url, data, success, error);
  });
}

$(document).ready(handleSubscription);

/* 订阅确认 */
function subscribeConfirm() {
  var pathname = window.location.pathname;
  var confirmUrl = "/subscription/confirm/";

  if (pathname === confirmUrl) {
    const params = new URLSearchParams(window.location.search);
    var args = {};
    for (const param of params) {
      args[param[0]] = param[1];
    }

    var token = args?.token;
    const url = `api/v1/subscriptions/confirm-subscription?token=${token}`;

    var alertDiv = $("#confirm_alert");
    var successDiv = $("#confirm_success");
    alertDiv.hide();
    successDiv.hide();

    function success(response) {
      alertDiv.hide();
      successDiv.show().text("订阅已经确认成功");
    }

    function error(response) {
      var detail = JSON.stringify(response.detail);
      if (detail.indexOf("has been subscribed") > -1) {
        successDiv.show().text("您已订阅，请勿重复订阅。");
        alertDiv.hide();
      } else {
        alertDiv.show().text(`订阅失败，请重试：${detail}`);
        successDiv.hide();
      }
    }

    ajax("get", url, null, success, error, false);
  }
}

$(document).ready(subscribeConfirm);
