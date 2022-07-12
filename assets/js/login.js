function handlePwdInput(inputFormId) {
  var inputEle = $(`#${inputFormId} input`);
  var aEle = $(`#${inputFormId} a`);
  var iEle = $(`#${inputFormId} i`);
  aEle.on("click", function (event) {
    event.preventDefault();
    if (inputEle.attr("type") == "text") {
      inputEle.attr("type", "password");
      iEle.addClass("fa-eye-slash");
      iEle.removeClass("fa-eye");
    } else if (inputEle.attr("type") == "password") {
      inputEle.attr("type", "text");
      iEle.removeClass("fa-eye-slash");
      iEle.addClass("fa-eye");
    }
  });
}

$(document).ready(function () {
  handlePwdInput("show_hide_password");
  handlePwdInput("show_hide_password_confirm");
});
