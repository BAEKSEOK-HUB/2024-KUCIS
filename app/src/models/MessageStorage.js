"use strict";

const db = require("../config/db");

class MessageStorage {
  static async saveMessageList({ postnum, sender_id, reciver_id }) {
    // sender_id와 reciver_id 값 검증
    if (!sender_id || !reciver_id || sender_id.trim() === '' || reciver_id.trim() === '') {
      throw new Error("Both sender_id and reciver_id are required and cannot be empty.");
    }

    const userExistsQuery = `SELECT id FROM users WHERE id IN (?, ?)`;
    const [users] = await db.promise().query(userExistsQuery, [sender_id, reciver_id]);
    if (users.length < 2) {
      throw new Error("sender_id or reciver_id does not exist.");
    }

    const query = `
      INSERT INTO message_list (postnum, sender_id, reciver_id, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    return db.promise()
      .query(query, [postnum, sender_id, reciver_id])
      .then(() => ({ success: true }))
      .catch((err) => {
        console.error("Error saving message list:", err);
        throw new Error("Failed to save message list. Please check sender_id and reciver_id.");
      });
  }

  static async getMessagesByPostnum(postnum) {
    const query = `
      SELECT * FROM message_list WHERE postnum = ?
    `;
    try {
      const [results] = await db.promise().query(query, [postnum]);
      return results;
    } catch (err) {
      console.error("Error fetching messages by postnum:", err);
      throw err;
    }
  }

  static async getMessagesByRoomId(roomid) {
    const query = `
    SELECT 
      messageid, 
      roomid, 
      sender_id, 
      reciver_id, 
      content, 
      send_time AS created_at, -- 별칭 설정
      report 
    FROM 
      message 
    WHERE 
      roomid = ? 
    ORDER BY send_time ASC; -- 정렬 기준 수정
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
      console.error("Error fetching messages by room ID:", err);
      throw err;
    }
  }

  static async getReciverIdByRoomId(roomid, currentUser) {
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
      throw new Error("No message data found for the given roomid.");
    } catch (err) {
      console.error("Error fetching reciver_id by room ID:", err);
      throw err;
    }
  }

  static async createMessage(roomid, postnum, sender_id, content) {
    try {
      const reciver_id = await this.getReciverIdByRoomId(roomid, sender_id);

      const query = `
        INSERT INTO message (roomid, postnum, send_time, sender_id, reciver_id, content)
        VALUES (?, ?, NOW(), ?, ?, ?)
      `;
      const [result] = await db
        .promise()
        .query(query, [roomid, postnum, sender_id, reciver_id, content]);
      return result;
    } catch (err) {
      console.error("Error creating message:", err);
      throw err;
    }
  }

  static async getMessagesForUser(userid) {
    const query = `
    SELECT 
      m.roomid, 
      m.reciver_id, 
      m.sender_id, 
      p.title AS message_title, 
      m.created_at, 
      msg.report 
    FROM 
      message_list m
    JOIN 
      posts p 
    ON 
      m.postnum = p.postnum
    JOIN 
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
      console.error("Error fetching messages for user:", err);
      throw err;
    }
  }
}

module.exports = MessageStorage;
