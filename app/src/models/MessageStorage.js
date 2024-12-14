const db = require("../config/db");

class MessageStorage {
  // 중복 확인 메서드
  static async checkMessageListExists(postnum, sender_id, reciver_id) {
    const [sortedsender_id, sortedreciver_id] = [sender_id, reciver_id].sort(); // 정렬하여 일관된 순서로 사용
    const query = `
      SELECT * FROM message_list 
      WHERE postnum = ? AND sender_id = ? AND reciver_id = ?
    `;
    const [rows] = await db.promise().query(query, [postnum, sortedsender_id, sortedreciver_id]);
    console.log("중복 확인 결과:", rows.length > 0 ? "중복 존재" : "중복 없음"); // 중복 여부 로그
    return rows.length > 0; // 존재하면 true 반환
  }

  // 쪽지 리스트 저장 메서드
  static async saveMessageList({ postnum, sender_id, reciver_id }) {
    const [sortedsender_id, sortedreciver_id] = [sender_id, reciver_id].sort(); // 정렬하여 일관된 순서로 사용
    const exists = await this.checkMessageListExists(postnum, sortedsender_id, sortedreciver_id);
    if (exists) {
      return { success: false, message: "이미 존재하는 쪽지 리스트입니다." };
    }
    const query = `
      INSERT INTO message_list (postnum, sender_id, reciver_id, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    const [result] = await db.promise().query(query, [postnum, sortedsender_id, sortedreciver_id]);
    console.log("새로운 쪽지 리스트가 저장되었습니다."); // 쪽지 리스트 저장 로그
    return { success: true };
  }


  static getProfaneMessageCount() {
    return new Promise((resolve, reject) => {
      const query = "SELECT COUNT(*) AS count FROM message WHERE report = 1";
      db.query(query, (err, result) => {
        if (err) reject(err);
        resolve(result[0].count);
      });
    });
  }

  static getProfaneMessages() {
    return new Promise((resolve, reject) => {
      const query = "SELECT * FROM message WHERE report = 1";
      db.query(query, (err, results) => {
        if (err) reject(`${err}`);
        resolve(results);
      });
    });
  }

  static async getMessagesByPostnum(postnum) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM message_list WHERE postnum = ?`;
      db.query(query, [postnum], (err, results) => {
        if (err) {
          console.error("메시지 조회 오류:", err);
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  static async getMessagesByRoomId(roomid) {
    const query = `
      SELECT 
        messageid, 
        roomid, 
        sender_id, 
        reciver_id, 
        content, 
        send_time,
        report 
      FROM 
        message 
      WHERE 
        roomid = ? 
      ORDER BY send_time ASC;
    `;
    try {
      const [messages] = await db.promise().query(query, [roomid]);
      const processedMessages = messages.map((message) => {
        if (message.report === 1) {
          message.content = "차단된 메시지입니다";
        }
        return message;
      });
      return processedMessages;
    } catch (err) {
      console.error("메시지 조회 오류:", err);
      throw err;
    }
  }

  static async getreciver_idByRoomId(roomid, currentUser) {
    const query = `
      SELECT sender_id, reciver_id
      FROM message_list
      WHERE roomid = ?
    `;
    try {
      const [rows] = await db.promise().query(query, [roomid]);
      if (rows.length > 0) {
        const { sender_id, reciver_id } = rows[0];
        return sender_id === currentUser ? reciver_id : sender_id;
      }
      throw new Error("해당 roomid에 대한 쪽지 정보를 찾을 수 없습니다.");
    } catch (err) {
      console.error("reciver_id 조회 오류:", err);
      throw err;
    }
  }

  static async createMessage(roomid, postnum, sender_id, content, report) {
    try {
      const reciver_id = await this.getreciver_idByRoomId(roomid, sender_id);
      const query = `
        INSERT INTO message (roomid, postnum, send_time, sender_id, reciver_id, content, report)
        VALUES (?, ?, NOW(), ?, ?, ?, ?)
      `;
      const [result] = await db.promise().query(query, [roomid, postnum, sender_id, reciver_id, content, report]);
      return result;
    } catch (err) {
      console.error("메시지 생성 오류:", err);
      throw err;
    }
  }

  static async getMessagesForUser(userid) {
    const query = `
        SELECT DISTINCT 
            m.roomid, 
            m.reciver_id, 
            m.sender_id, 
            p.title AS message_title, 
            m.created_at, 
            msg.report -- 'message' 테이블에서 report 가져오기
        FROM 
            message_list m
        JOIN 
            posts p 
        ON 
            m.postnum = p.postnum
        LEFT JOIN 
            message msg 
        ON 
            m.roomid = msg.roomid
        WHERE 
            (m.sender_id = ? OR m.reciver_id = ?)
        ORDER BY m.created_at DESC;
    `;
    try {
        const [messages] = await db.promise().query(query, [userid, userid]);

        const processedMessages = messages.map((message) => {
            if (message.report === 1) {
                message.message_title = "차단된 메시지입니다";
            }
            return message;
        });

        return processedMessages;
    } catch (err) {
        console.error("DB에서 쪽지 가져오기 오류:", err);
        throw err;
    }
  }
}

module.exports = MessageStorage;