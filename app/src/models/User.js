"use strict";

const UserStorage = require("./UserStorage");

class User {
  constructor(body) {
    this.body = body; // 클라이언트로부터 전달된 데이터를 저장
  }

  // 로그인 메소드
  async login() {
    const client = this.body; // 클라이언트 입력 데이터를 가져옴
    try {
      const user = await UserStorage.getUserInfo(client.id); // UserStorage를 통해 사용자 정보 조회
      if (user) { 
        // 아이디와 비밀번호 검증
        if (user.id === client.id && user.password === client.password) {
          return { success: true }; // 로그인 성공
        }
        return { success: false, msg: "비밀번호가 틀렸습니다." }; // 비밀번호 불일치
      }
      return { success: false, msg: "존재하지 않는 아이디입니다." }; // 아이디 없음
    } catch (err) {
      return { success: false, msg: err }; // 오류 발생 시 처리
    }
  }

  // 회원가입 메소드
  async register() {
    const client = this.body; // 클라이언트 입력 데이터를 가져옴
    try {
      const response = await UserStorage.save(client); // UserStorage를 통해 사용자 데이터 저장
      return response; // 저장 결과 반환
    } catch (err) {
      return { success: false, msg: err }; // 오류 발생 시 처리
    }
  }
}

// User 클래스를 모듈로 내보냄
module.exports = User;
