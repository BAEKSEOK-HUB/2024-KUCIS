const db = require("../config/db");

class MessageStorage {
  static async saveMessageList({ postnum, sender, reciper }) {
    return new Promise((resolve, reject) => {
      const query = `
            INSERT INTO message_list (postnum, sender, reciper, created_at)
            VALUES (?, ?, ?, NOW())
        `;
      db.query(query, [postnum, sender, reciper], (err, result) => {
        if (err) {
          console.error("메시지 저장 오류:", err);
          reject(err);
        } else {
          resolve({ success: true });
        }
      });
    });
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
      const query = `
            SELECT * FROM message_list WHERE postnum = ?
        `;
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
  // 메시지를 roomid를 기준으로 조회
  static async getMessagesByRoomId(roomid) {
    const query = `
    SELECT 
      messageid, 
      roomid, 
      sender, 
      reciper, 
      content, 
      send_time,
      report -- 'message' 테이블에서 report 가져오기
    FROM 
      message 
    WHERE 
      roomid = ? 
    ORDER BY send_time ASC;
  `;
    try {
      const [messages] = await db.promise().query(query, [roomid]);

      // report 값이 1인 경우 content를 "차단된 메시지입니다"로 변경
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

  // message_list에서 roomid로 reciper를 가져오는 메서드
  static async getReciperByRoomId(roomid, currentUser) {
    const query = `
      SELECT sender, reciper
      FROM message_list
      WHERE roomid = ?
    `;
    try {
      const [rows] = await db.promise().query(query, [roomid]);
      if (rows.length > 0) {
        const { sender, reciper } = rows[0];
        // 내가 sender이면 상대방이 reciper, 내가 reciper이면 상대방이 sender
        return sender === currentUser ? reciper : sender;
      }
      throw new Error("해당 roomid에 대한 쪽지 정보를 찾을 수 없습니다.");
    } catch (err) {
      console.error("reciper 조회 오류:", err);
      throw err;
    }
  }

  // 메시지를 DB에 저장하는 메서드
  static async createMessage(roomid, postnum, sender, content, report) {
    try {
        const reciper = await this.getReciperByRoomId(roomid, sender);

        const query = `
            INSERT INTO message (roomid, postnum, send_time, sender, reciper, content, report)
            VALUES (?, ?, NOW(), ?, ?, ?, ?)
        `;
        const [result] = await db
            .promise()
            .query(query, [roomid, postnum, sender, reciper, content, report]);
        return result; // 생성된 메시지의 결과 반환
    } catch (err) {
        console.error("메시지 생성 오류:", err);
        throw err;
    }
}

  // 사용자의 쪽지 목록을 가져오는 메서드
  static async getMessagesForUser(userid) {
    const query = `
    SELECT 
      m.roomid, 
      m.reciper, 
      m.sender, 
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
      message msg -- 'LEFT JOIN'으로 변경하여 message가 없어도 출력 가능하게 함
    ON 
      m.roomid = msg.roomid
    WHERE 
      (m.sender = ? OR m.reciper = ?)
    ORDER BY m.created_at DESC;
  `;
    try {
      const [messages] = await db.promise().query(query, [userid, userid]);

      // report 값이 1인 경우 message_title을 "차단된 메시지입니다"로 변경
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
  
  static async checkMessageListExists(postnum, sender, reciper) {
    const query = `
      SELECT * FROM message_list 
      WHERE postnum = ? AND sender = ? AND reciper = ?
    `;
    const [rows] = await db.promise().query(query, [postnum, sender, reciper]);
    return rows.length > 0; // 존재하면 true 반환
  }

  // 쪽지 리스트를 생성할 때 중복 체크 포함
  static async saveMessageList({ postnum, sender, reciper }) {
    const exists = await this.checkMessageListExists(postnum, sender, reciper);
    if (exists) {
      return { success: false, message: "이미 존재하는 쪽지 리스트입니다." };
    }
    const query = `
      INSERT INTO message_list (postnum, sender, reciper, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    const [result] = await db.promise().query(query, [postnum, sender, reciper]);
    return { success: true };
  }
}

module.exports = MessageStorage;
