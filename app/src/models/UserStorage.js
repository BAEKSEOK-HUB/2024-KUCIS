"use strict";

const db = require("../config/db");

class UserStorage {
    // 특정 사용자의 정보를 가져오는 메소드
    static getUserInfo(id) {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM users WHERE id = ?"; // 사용자 테이블에서 특정 id의 데이터를 조회
            db.query(query, [id], (err, data) => { 
                if (err) reject(err); // 에러 발생 시 에러 반환
                resolve(data[0]); // 조회된 첫 번째 데이터 반환
            });
        });
    }

    // 새로운 사용자의 정보를 저장하는 메소드
    static async save(userInfo) {
        return new Promise((resolve, reject) => {
            const query = "INSERT INTO users(id, password, name) VALUES(?,?,?);"; // 사용자 테이블에 새로운 데이터를 삽입
            db.query(query, 
                [userInfo.id, userInfo.password, userInfo.name], // 입력받은 사용자 정보(id, password, name) 저장
                (err) => {
                    if (err) reject(err); // 에러 발생 시 에러 반환
                    resolve({ success: true }); // 성공 시 success 메시지 반환
                });
        });
    }
}

// UserStorage 클래스를 모듈로 내보냄
module.exports = UserStorage;
