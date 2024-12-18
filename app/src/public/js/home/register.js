"use strict";

// DOM 요소 선택: 입력 필드와 체크박스, 버튼
const id = document.querySelector("#id"), // 아이디 입력 필드
  password = document.querySelector("#password"), // 비밀번호 입력 필드
  confirmpassword = document.querySelector("#Confirm-password"), // 비밀번호 확인 필드
  name = document.querySelector("#name"), // 이름 입력 필드
  termsAgree = document.querySelector("#terms-agree"), // 이용약관 동의 체크박스
  privacyAgree = document.querySelector("#privacy-agree"), // 개인정보처리방침 동의 체크박스
  registerBtn = document.querySelector("#button"); // 회원가입 버튼

// 회원가입 버튼 클릭 이벤트 리스너 등록
registerBtn.addEventListener("click", register);

// 회원가입 함수
function register(event) {
  event.preventDefault(); // 폼 자동 제출 방지

  // 입력값 검증
  if (!id.value) return alert("아이디를 입력해주십시오."); // 아이디가 입력되지 않은 경우
  if (password.value !== confirmpassword.value) { // 비밀번호와 확인 비밀번호 불일치
    return alert("비밀번호가 일치하지 않습니다.");
  }
  if (!termsAgree.checked) { // 이용약관 미동의 시
    return alert("이용약관에 동의해주십시오.");
  }
  if (!privacyAgree.checked) { // 개인정보처리방침 미동의 시
    return alert("개인정보처리방침에 동의해주십시오.");
  }

  // 요청 데이터 객체 생성
  const req = {
    id: id.value, // 입력된 아이디
    password: password.value, // 입력된 비밀번호
    name: name.value, // 입력된 이름
  };

  // 서버에 회원가입 요청 보내기
  fetch("/register", {
    method: "POST", // HTTP POST 메서드 사용
    headers: {
      "Content-Type": "application/json", // 요청 데이터 타입: JSON
    },
    body: JSON.stringify(req), // 요청 데이터를 JSON 문자열로 변환
  })
    .then((res) => res.json()) // 서버 응답을 JSON으로 변환
    .then((res) => {
      if (res.success) { // 성공 시
        location.href = "/"; // 메인 페이지로 리다이렉트
      } else { // 실패 시 에러 메시지 처리
        if (res.err) return alert(res.err); // 서버 오류 메시지 표시
        alert(res.msg); // 일반 오류 메시지 표시
      }
    })
    .catch((err) => { // 네트워크 또는 요청 중 에러 발생 시
      console.error(new Error("회원가입 에러")); // 콘솔에 에러 출력
    });
}
