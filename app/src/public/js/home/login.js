"use strict";

// DOM 요소 선택: 아이디, 비밀번호 입력 필드와 로그인 버튼
const id = document.querySelector('#id'), // 아이디 입력 필드
    password = document.querySelector('#password'), // 비밀번호 입력 필드
    loginBtn = document.querySelector("#button"); // 로그인 버튼

// 로그인 버튼 클릭 이벤트 리스너 등록
loginBtn.addEventListener("click", login);

// 로그인 함수
function login() {
    // 아이디와 비밀번호 입력값 유효성 검사
    if (!id.value) return alert("아이디를 입력해주십시오."); // 아이디 미입력 시 알림
    if (!password.value) return alert("비밀번호를 입력해주십시오."); // 비밀번호 미입력 시 알림

    // 요청 객체 생성
    const req = {
        id: id.value, // 입력된 아이디 값
        password: password.value, // 입력된 비밀번호 값
    };

    // 서버에 로그인 요청 보내기
    fetch("/login", {
        method: "Post", // HTTP POST 메서드 사용
        headers: {
            "Content-Type": "application/json", // 요청 데이터 타입: JSON
        },
        body: JSON.stringify(req), // 요청 데이터를 JSON 문자열로 변환
    })
    .then((res) => res.json()) // 서버로부터의 응답을 JSON 형태로 변환
    .then((res) => {
        if (res.success) { // 성공 시
            location.href = "/login"; // 로그인 성공 후 리다이렉트
        } else { // 실패 시 에러 메시지 처리
            if (res.err) return alert(res.err); // 서버 에러 메시지 표시
                alert(res.msg); // 일반 에러 메시지 표시
        }
    })
    .catch((err) => { // 네트워크 또는 요청 중 에러 발생 시 처리
        console.error("로그인 중 에러 발생"); // 에러 메시지 콘솔 출력
    });
}