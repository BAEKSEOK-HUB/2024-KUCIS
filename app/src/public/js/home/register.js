"use strict";

const id = document.querySelector("#id"),
  password = document.querySelector("#password"),
  confirmpassword = document.querySelector("#Confirm-password"),
  name = document.querySelector("#name"),
  termsAgree = document.querySelector("#terms-agree"), // 이용약관 동의 체크박스
  privacyAgree = document.querySelector("#privacy-agree"), // 개인정보처리방침 동의 체크박스
  registerBtn = document.querySelector("#button");

registerBtn.addEventListener("click", register);

function register(event) {
  event.preventDefault(); // 폼이 바로 제출되지 않도록 방지

  if (!id.value) return alert("아이디를 입력해주십시오.");
  if (password.value !== confirmpassword.value) {
    return alert("비밀번호가 일치하지 않습니다.");
  }
  if (!termsAgree.checked) {
    return alert("이용약관에 동의해주십시오.");
  }
  if (!privacyAgree.checked) {
    return alert("개인정보처리방침에 동의해주십시오.");
  }

  const req = {
    id: id.value,
    password: password.value,
    name: name.value,
  };

  fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        location.href = "/";
      } else {
        if (res.err) return alert(res.err);
        alert(res.msg);
      }
    })
    .catch((err) => {
      console.error(new Error("회원가입 에러"));
    });
}
